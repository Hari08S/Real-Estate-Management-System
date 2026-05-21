package com.squarefeetx.admin.controller;

import com.squarefeetx.admin.model.AuditLog;
import com.squarefeetx.admin.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final RestTemplate restTemplate;
    private final AuditLogRepository auditLogRepository;

    @Value("${app.services.property-url}")
    private String propertyServiceUrl;

    @Value("${app.services.auth-url}")
    private String authServiceUrl;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        long totalProperties = fetchCount(propertyServiceUrl + "/api/properties/internal/count");
        long totalUsers = fetchCount(authServiceUrl + "/api/users/internal/count");

        List<Map<String, Object>> monthlyData = List.of(
                Map.of("month", "Sep", "listings", 12, "inquiries", 30),
                Map.of("month", "Oct", "listings", 18, "inquiries", 45),
                Map.of("month", "Nov", "listings", 25, "inquiries", 60),
                Map.of("month", "Dec", "listings", 30, "inquiries", 80),
                Map.of("month", "Jan", "listings", 38, "inquiries", 95),
                Map.of("month", "Feb", "listings", 45, "inquiries", 120)
        );

        List<Map<String, Object>> categoryData = List.of(
                Map.of("name", "Apartments", "value", 45),
                Map.of("name", "Villas", "value", 20),
                Map.of("name", "Plots", "value", 15),
                Map.of("name", "Commercial", "value", 12),
                Map.of("name", "Others", "value", 8)
        );

        return ResponseEntity.ok(Map.of(
                "totalProperties", totalProperties,
                "totalUsers", totalUsers,
                "totalInquiries", 89,
                "monthlyData", monthlyData,
                "categoryData", categoryData
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        try {
            ResponseEntity<List<Map<String, Object>>> resp = restTemplate.exchange(
                    authServiceUrl + "/api/users/internal/all",
                    HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {});
            return ResponseEntity.ok(Map.of("users", resp.getBody() != null ? resp.getBody() : List.of()));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("users", List.of()));
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.put(authServiceUrl + "/api/users/internal/" + id + "/roles", entity);
            logAction("USER_UPDATED", id, "User details updated");
            return ResponseEntity.ok(Map.of("message", "User updated"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to update user"));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            restTemplate.delete(authServiceUrl + "/api/users/internal/" + id);
            logAction("USER_DELETED", id, "User deleted");
            return ResponseEntity.ok(Map.of("message", "User deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to delete user"));
        }
    }

    @GetMapping("/managers")
    public ResponseEntity<?> getManagers() {
        try {
            ResponseEntity<List<Map<String, Object>>> resp = restTemplate.exchange(
                    authServiceUrl + "/api/users/internal/managers",
                    HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {});
            return ResponseEntity.ok(Map.of("managers", resp.getBody() != null ? resp.getBody() : List.of()));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("managers", List.of()));
        }
    }

    @PostMapping("/managers/assign")
    public ResponseEntity<?> assignManager(@RequestBody Map<String, String> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(authServiceUrl + "/api/users/internal/managers/assign",
                    new HttpEntity<>(body, headers), Map.class);
            logAction("MANAGER_ASSIGNED", body.get("managerId"), "City: " + body.get("city"));
            return ResponseEntity.ok(Map.of("message", "Manager assigned"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to assign manager"));
        }
    }

    @PostMapping("/managers/unassign")
    public ResponseEntity<?> unassignManager(@RequestBody Map<String, String> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(authServiceUrl + "/api/users/internal/managers/unassign",
                    new HttpEntity<>(body, headers), Map.class);
            logAction("MANAGER_UNASSIGNED", body.get("managerId"), "City: " + body.get("city"));
            return ResponseEntity.ok(Map.of("message", "City unassigned from manager"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to unassign"));
        }
    }

    @PostMapping("/managers/create")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> createManager(@RequestBody Map<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<Map<String, Object>> resp = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.postForEntity(
                    authServiceUrl + "/api/users/internal/managers/create",
                    new HttpEntity<>(body, headers), Map.class);
            logAction("MANAGER_CREATED", "", "Manager created: " + body.get("name"));
            return ResponseEntity.ok(resp.getBody());
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to create manager: " + e.getMessage()));
        }
    }

    @DeleteMapping("/managers/{id}")
    public ResponseEntity<?> deleteManager(@PathVariable String id) {
        try {
            restTemplate.delete(authServiceUrl + "/api/users/internal/" + id);
            logAction("MANAGER_DELETED", id, "Manager deleted");
            return ResponseEntity.ok(Map.of("message", "Manager deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to delete manager"));
        }
    }

    @PutMapping("/managers/{id}")
    public ResponseEntity<?> updateManager(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.put(authServiceUrl + "/api/users/internal/" + id + "/roles", entity);
            logAction("MANAGER_UPDATED", id, "Manager details updated");
            return ResponseEntity.ok(Map.of("message", "Manager updated"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to update manager"));
        }
    }

    @GetMapping("/managers/by-city")
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

    @GetMapping("/properties")
    public ResponseEntity<?> getProperties() {
        try {
            ResponseEntity<List<Map<String, Object>>> resp = restTemplate.exchange(
                    propertyServiceUrl + "/api/properties/internal/all",
                    HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {});
            return ResponseEntity.ok(Map.of("properties", resp.getBody() != null ? resp.getBody() : List.of()));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("properties", List.of()));
        }
    }

    @DeleteMapping("/properties/{id}")
    public ResponseEntity<?> deleteProperty(@PathVariable String id) {
        restTemplate.delete(propertyServiceUrl + "/api/properties/internal/" + id);
        logAction("PROPERTY_DELETED", "", "Property " + id + " deleted");
        return ResponseEntity.ok(Map.of("message", "Property deleted"));
    }

    @PutMapping("/properties/{id}/status")
    public ResponseEntity<?> updatePropertyStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        restTemplate.put(propertyServiceUrl + "/api/properties/internal/" + id + "/status",
                new HttpEntity<>(body, headers));
        logAction("PROPERTY_STATUS_CHANGED", "", "Property " + id + " → " + body.get("status"));
        return ResponseEntity.ok(Map.of("message", "Status updated"));
    }

    @GetMapping("/audit-log")
    public ResponseEntity<?> getAuditLog() {
        return ResponseEntity.ok(Map.of("logs", auditLogRepository.findAllByOrderByCreatedAtDesc()));
    }

    private void logAction(String action, String userId, String details) {
        auditLogRepository.save(AuditLog.builder()
                .action(action)
                .userId(userId)
                .details(details)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private long fetchCount(String url) {
        try {
            return restTemplate.getForObject(url, Long.class);
        } catch (Exception e) {
            return 0;
        }
    }
}
