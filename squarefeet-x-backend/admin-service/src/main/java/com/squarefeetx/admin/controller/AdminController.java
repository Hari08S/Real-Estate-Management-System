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
        long totalUsers = fetchCount(authServiceUrl + "/api/users/internal/count");

        List<Map<String, Object>> props = fetchProperties(propertyServiceUrl + "/api/properties/internal/all");
        long totalProperties = props.size();

        long totalInquiries = props.stream()
                .mapToLong(p -> {
                    Object unlockVal = p.get("unlockCount");
                    if (unlockVal instanceof Number) {
                        return ((Number) unlockVal).longValue();
                    }
                    return 0;
                })
                .sum();

        // Calculate categoryData dynamically based on propertyType
        Map<String, Integer> typeCounts = new HashMap<>();
        for (Map<String, Object> p : props) {
            String type = (String) p.get("propertyType");
            if (type != null) {
                String capitalized = type.substring(0, 1).toUpperCase() + type.substring(1).toLowerCase();
                if (!capitalized.endsWith("s")) {
                    capitalized += "s";
                }
                typeCounts.put(capitalized, typeCounts.getOrDefault(capitalized, 0) + 1);
            }
        }
        List<Map<String, Object>> categoryData = new ArrayList<>();
        if (totalProperties > 0) {
            for (Map.Entry<String, Integer> entry : typeCounts.entrySet()) {
                int percent = (int) Math.round((entry.getValue() * 100.0) / totalProperties);
                categoryData.add(Map.of("name", entry.getKey(), "value", percent));
            }
        } else {
            categoryData = List.of(
                    Map.of("name", "Apartments", "value", 0),
                    Map.of("name", "Villas", "value", 0),
                    Map.of("name", "Plots", "value", 0),
                    Map.of("name", "Commercial", "value", 0),
                    Map.of("name", "Others", "value", 0)
            );
        }

        // Calculate monthlyData dynamically for the last 6 months based on createdAt
        String[] monthNames = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        Map<String, Integer> monthlyListings = new LinkedHashMap<>();
        Map<String, Integer> monthlyInquiries = new LinkedHashMap<>();
        
        java.time.LocalDate now = java.time.LocalDate.now();
        List<String> last6Months = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            java.time.LocalDate date = now.minusMonths(i);
            String mName = monthNames[date.getMonthValue() - 1];
            last6Months.add(mName);
            monthlyListings.put(mName, 0);
            monthlyInquiries.put(mName, 0);
        }
        
        for (Map<String, Object> p : props) {
            Object createdVal = p.get("createdAt");
            if (createdVal != null) {
                try {
                    String dateStr = createdVal.toString();
                    int monthIndex = -1;
                    if (dateStr.contains("-")) {
                        String[] parts = dateStr.split("-");
                        if (parts.length >= 2) {
                            monthIndex = Integer.parseInt(parts[1]) - 1;
                        }
                    }
                    if (monthIndex >= 0 && monthIndex < 12) {
                        String mName = monthNames[monthIndex];
                        if (monthlyListings.containsKey(mName)) {
                            monthlyListings.put(mName, monthlyListings.get(mName) + 1);
                            
                            long unlocks = 0;
                            Object unlockVal = p.get("unlockCount");
                            if (unlockVal instanceof Number) {
                                unlocks = ((Number) unlockVal).longValue();
                            }
                            monthlyInquiries.put(mName, monthlyInquiries.get(mName) + (int)unlocks);
                        }
                    }
                } catch (Exception e) {
                    // skip
                }
            }
        }
        
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        for (String mName : last6Months) {
            monthlyData.add(Map.of(
                "month", mName,
                "listings", monthlyListings.get(mName),
                "inquiries", monthlyInquiries.get(mName)
            ));
        }

        return ResponseEntity.ok(Map.of(
                "totalProperties", totalProperties,
                "totalUsers", totalUsers,
                "totalInquiries", totalInquiries,
                "monthlyData", monthlyData,
                "categoryData", categoryData
        ));
    }

    private List<Map<String, Object>> fetchProperties(String url) {
        try {
            ResponseEntity<List<Map<String, Object>>> resp = restTemplate.exchange(
                    url,
                    HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {});
            return resp.getBody() != null ? resp.getBody() : List.of();
        } catch (Exception e) {
            return List.of();
        }
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
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> getManagers() {
        try {
            ResponseEntity<List<Map<String, Object>>> resp = restTemplate.exchange(
                    authServiceUrl + "/api/users/internal/managers",
                    HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {});
            List<Map<String, Object>> managers = resp.getBody() != null ? resp.getBody() : List.of();

            List<Map<String, Object>> properties = fetchProperties(propertyServiceUrl + "/api/properties/internal/all");

            long totalActiveListings = 0;
            int totalStatesCovered = 0;

            List<Map<String, Object>> enrichedManagers = new ArrayList<>();
            for (Map<String, Object> manager : managers) {
                Map<String, Object> enriched = new HashMap<>(manager);
                List<String> assignedCities = (List<String>) enriched.get("cities");
                long activeCount = 0;
                if (assignedCities != null && !assignedCities.isEmpty()) {
                    totalStatesCovered += assignedCities.size();
                    activeCount = properties.stream().filter(p -> {
                        String status = (String) p.get("status");
                        if ("DRAFT".equals(status) || "REJECTED".equals(status) || "SOLD".equals(status)) return false;
                        Map<String, Object> loc = (Map<String, Object>) p.get("location");
                        if (loc == null) return false;
                        String pCity = loc.get("city") != null ? loc.get("city").toString().toLowerCase() : "";
                        String pState = loc.get("state") != null ? loc.get("state").toString().toLowerCase() : "";
                        return assignedCities.stream().anyMatch(c -> {
                            String lowerCity = c.toLowerCase();
                            return lowerCity.equals(pCity) || lowerCity.equals(pState);
                        });
                    }).count();
                }
                enriched.put("activeListings", activeCount);
                totalActiveListings += activeCount;
                enrichedManagers.add(enriched);
            }

            return ResponseEntity.ok(Map.of(
                    "managers", enrichedManagers,
                    "totalManagers", enrichedManagers.size(),
                    "statesCovered", totalStatesCovered,
                    "activeListings", totalActiveListings
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "managers", List.of(),
                    "totalManagers", 0,
                    "statesCovered", 0,
                    "activeListings", 0
            ));
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
