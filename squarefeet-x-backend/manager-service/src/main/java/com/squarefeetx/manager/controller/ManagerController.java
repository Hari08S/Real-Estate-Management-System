package com.squarefeetx.manager.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final RestTemplate restTemplate;

    @Value("${app.services.property-url}")
    private String propertyServiceUrl;

    @Value("${app.services.auth-url}")
    private String authServiceUrl;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        List<String> cities = getManagerCities();
        List<Map<String, Object>> allProps = fetchProperties("/api/properties/internal/all").stream()
                .filter(p -> matchesCity(p, cities))
                .toList();
        
        long pending = allProps.stream().filter(p -> "PENDING".equals(p.get("status"))).count();
        long reviewing = allProps.stream().filter(p -> "UNDER_REVIEW".equals(p.get("status"))).count();
        long approved = allProps.stream().filter(p -> "APPROVED".equals(p.get("status"))).count();
        long rejected = allProps.stream().filter(p -> "REJECTED".equals(p.get("status"))).count();

        return ResponseEntity.ok(Map.of(
                "totalPending", pending,
                "totalReviewing", reviewing,
                "totalApproved", approved,
                "totalRejected", rejected,
                "recentActivity", allProps.stream().limit(5).toList()
        ));
    }

    @GetMapping("/cities")
    public ResponseEntity<?> getMyCities() {
        return ResponseEntity.ok(Map.of("cities", getManagerCities()));
    }

    @GetMapping("/unassigned")
    public ResponseEntity<?> getUnassignedListings() {
        List<String> cities = getManagerCities();
        List<Map<String, Object>> pending = fetchProperties("/api/properties/internal/status/PENDING").stream()
                .filter(p -> matchesCity(p, cities))
                .toList();
        return ResponseEntity.ok(Map.of("properties", pending));
    }

    @PutMapping("/{id}/claim")
    public ResponseEntity<?> claimListing(@PathVariable String id) {
        Map<String, String> body = Map.of("status", "UNDER_REVIEW");
        restTemplate.put(propertyServiceUrl + "/api/properties/internal/" + id + "/status", body);
        return ResponseEntity.ok(Map.of("message", "Listing claimed"));
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<?> reviewListing(@PathVariable String id, @RequestBody Map<String, String> body) {
        String action = body.getOrDefault("action", "").toUpperCase();
        String status = "APPROVE".equals(action) ? "APPROVED" : "REJECTED";
        Map<String, String> reqBody = new HashMap<>();
        reqBody.put("status", status);
        String reason = body.get("reason");
        if (reason == null) {
            reason = body.get("rejectionReason");
        }
        reqBody.put("reason", reason);
        restTemplate.put(propertyServiceUrl + "/api/properties/internal/" + id + "/status", reqBody);
        return ResponseEntity.ok(Map.of("message", "Listing " + action.toLowerCase() + "d"));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updatePropertyStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        Map<String, String> reqBody = new HashMap<>();
        reqBody.put("status", status);
        reqBody.put("reason", body.getOrDefault("reason", "Updated by City Manager"));
        restTemplate.put(propertyServiceUrl + "/api/properties/internal/" + id + "/status", reqBody);
        return ResponseEntity.ok(Map.of("message", "Status updated successfully"));
    }

    @GetMapping("/listings")
    public ResponseEntity<?> getListingsForReview() {
        List<String> cities = getManagerCities();
        List<Map<String, Object>> props = fetchProperties("/api/properties/internal/statuses?statuses=UNDER_REVIEW,PENDING").stream()
                .filter(p -> matchesCity(p, cities))
                .toList();
        return ResponseEntity.ok(Map.of("properties", props));
    }

    /**
     * Used by property-detail page to find the manager responsible for a city.
     * Calls auth-service internally to resolve the manager.
     */
    @GetMapping("/by-city")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> getManagerByCity(@RequestParam String city) {
        try {
            ResponseEntity<Map<String, Object>> resp = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.getForEntity(
                    authServiceUrl + "/api/users/internal/managers/by-city?city=" + city, Map.class);
            return ResponseEntity.ok(resp.getBody());
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("manager", null);
            return ResponseEntity.ok(response);
        }
    }

    private List<Map<String, Object>> fetchProperties(String path) {
        try {
            ResponseEntity<List<Map<String, Object>>> resp = restTemplate.exchange(
                    propertyServiceUrl + path,
                    HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {});
            return resp.getBody() != null ? resp.getBody() : List.of();
        } catch (Exception e) {
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> getManagerCities() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            ResponseEntity<Map<String, Object>> resp = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.getForEntity(
                    authServiceUrl + "/api/users/internal/" + userId, Map.class);
            Map<String, Object> user = resp.getBody();
            return user != null ? (List<String>) user.getOrDefault("cities", List.of("Hyderabad")) : List.of("Hyderabad");
        } catch (Exception e) {
            return List.of("Hyderabad");
        }
    }

    @SuppressWarnings("unchecked")
    private boolean matchesCity(Map<String, Object> property, List<String> assignedCities) {
        if (assignedCities == null || assignedCities.isEmpty()) return false;
        Map<String, Object> loc = (Map<String, Object>) property.get("location");
        if (loc == null || loc.get("state") == null) return false;
        String pState = loc.get("state").toString().toLowerCase();
        return assignedCities.stream().anyMatch(c -> c.toLowerCase().equals(pState));
    }
}
