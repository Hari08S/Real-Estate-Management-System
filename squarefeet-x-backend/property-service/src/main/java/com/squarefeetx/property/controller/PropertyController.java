package com.squarefeetx.property.controller;

import com.squarefeetx.property.model.Property;
import com.squarefeetx.property.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(propertyService.getAllApproved(params));
    }

    @SuppressWarnings("unchecked")
    @GetMapping("/buyer-dashboard")
    public ResponseEntity<?> getBuyerDashboard(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            jakarta.servlet.http.HttpServletRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Property> properties = propertyService.getSavedProperties(userId);
        
        int activeChats = 0;
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        if (token != null) {
            try {
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.set("Authorization", "Bearer " + token);
                headers.set("Cookie", "accessToken=" + token);
                org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);
                org.springframework.core.ParameterizedTypeReference<Map<String, Object>> responseType =
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {};
                ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    "http://localhost:8005/api/chat/conversations",
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    responseType
                );
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    List<?> convs = (List<?>) response.getBody().get("conversations");
                    if (convs != null) {
                        activeChats = convs.size();
                    }
                }
            } catch (Exception e) {
                // ignore and fallback to 0
            }
        }
        
        // Fetch user details first
        Map<?, ?> userMap = null;
        String activeRole = "BUYER";
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            userMap = restTemplate.getForObject(
                "http://localhost:8003/api/users/internal/" + userId, Map.class);
            if (userMap != null && userMap.get("activeRole") != null) {
                activeRole = (String) userMap.get("activeRole");
            }
        } catch (Exception e) {
            System.err.println("Error fetching user details: " + e.getMessage());
        }

        // Filter saved properties by user's active role
        final String finalActiveRole = activeRole;
        List<Property> filteredSaved = properties.stream()
            .filter(p -> {
                if ("BUYER".equalsIgnoreCase(finalActiveRole)) {
                    return "SALE".equalsIgnoreCase(p.getListingType());
                } else if ("RENTAL_SEEKER".equalsIgnoreCase(finalActiveRole)) {
                    return "RENT".equalsIgnoreCase(p.getListingType()) || "LEASE".equalsIgnoreCase(p.getListingType());
                }
                return true;
            })
            .collect(java.util.stream.Collectors.toList());

        // Fetch recently viewed properties up to a higher limit and filter them by active role for accurate count
        List<Property> recentlyViewed = propertyService.getRecentlyViewedProperties(userId, 1000);
        List<Property> filteredViewed = recentlyViewed.stream()
            .filter(p -> {
                if ("BUYER".equalsIgnoreCase(finalActiveRole)) {
                    return "SALE".equalsIgnoreCase(p.getListingType());
                } else if ("RENTAL_SEEKER".equalsIgnoreCase(finalActiveRole)) {
                    return "RENT".equalsIgnoreCase(p.getListingType()) || "LEASE".equalsIgnoreCase(p.getListingType());
                }
                return true;
            })
            .collect(java.util.stream.Collectors.toList());

        int totalSaved = filteredSaved.size();
        int totalInquiries = activeChats; // each conversation corresponds to an inquiry
        int totalViewed = filteredViewed.size();
        
        // Score calculation
        int credibilityScore = 0;
        int profileCompleteScore = 0;
        int phoneVerifiedScore = 0;
        int savedPropertiesScore = Math.min(20, totalSaved * 4);
        int inquiriesScore = Math.min(20, totalInquiries * 5);
        int accountAgeScore = 0;

        if (userMap != null) {
            String name = (String) userMap.get("name");
            String email = (String) userMap.get("email");
            String phone = (String) userMap.get("phone");
            
            int profileFields = 0;
            if (name != null && !name.trim().isEmpty()) profileFields++;
            if (email != null && !email.trim().isEmpty()) profileFields++;
            if (phone != null && !phone.trim().isEmpty()) profileFields++;
            
            profileCompleteScore = (int) Math.min(25, Math.round((profileFields / 3.0) * 25.0));
            phoneVerifiedScore = (phone != null && !phone.trim().isEmpty()) ? 20 : 0;
            savedPropertiesScore = Math.min(20, totalSaved * 4);
            inquiriesScore = Math.min(20, totalInquiries * 5);
            
            Object createdAtObj = userMap.get("createdAt");
            if (createdAtObj != null) {
                try {
                    java.time.LocalDateTime createdTime = null;
                    if (createdAtObj instanceof String) {
                        createdTime = java.time.LocalDateTime.parse((String) createdAtObj, java.time.format.DateTimeFormatter.ISO_DATE_TIME);
                    } else if (createdAtObj instanceof List) {
                        List<?> list = (List<?>) createdAtObj;
                        if (list.size() >= 3) {
                            int year = ((Number) list.get(0)).intValue();
                            int month = ((Number) list.get(1)).intValue();
                            int day = ((Number) list.get(2)).intValue();
                            createdTime = java.time.LocalDateTime.of(year, month, day, 0, 0);
                        }
                    }
                    if (createdTime != null) {
                        long diffInMs = java.time.Duration.between(createdTime, java.time.LocalDateTime.now()).toMillis();
                        double months = diffInMs / (1000.0 * 60.0 * 60.0 * 24.0 * 30.0);
                        accountAgeScore = (int) Math.min(15, Math.round(months * 2.0));
                    }
                } catch (Exception e) {
                    System.err.println("Error parsing user createdAt: " + e.getMessage());
                }
            }
            
            credibilityScore = profileCompleteScore + phoneVerifiedScore + savedPropertiesScore + inquiriesScore + accountAgeScore;
        } else {
            // Default calculation when user details are unavailable
            credibilityScore = savedPropertiesScore + inquiriesScore;
        }

        Map<String, Integer> buyerCredentialFactors = Map.of(
            "profileComplete", profileCompleteScore,
            "phoneVerified", phoneVerifiedScore,
            "savedProperties", savedPropertiesScore,
            "inquiries", inquiriesScore,
            "accountAge", accountAgeScore
        );

        // Fetch properties for you based on the user role
        List<Property> propertiesForYou = List.of();
        try {
            Map<String, String> params = new java.util.HashMap<>();
            if ("BUYER".equalsIgnoreCase(activeRole)) {
                params.put("listingType", "SALE");
            } else if ("RENTAL_SEEKER".equalsIgnoreCase(activeRole)) {
                params.put("listingType", "RENT,LEASE");
            }
            Map<String, Object> allApproved = propertyService.getAllApproved(params);
            if (allApproved != null && allApproved.get("properties") != null) {
                propertiesForYou = (List<Property>) allApproved.get("properties");
            }
        } catch (Exception e) {
            System.err.println("Error fetching properties for you: " + e.getMessage());
        }
        
        List<Property> responseRecentlyViewed = filteredViewed.subList(0, Math.min(20, filteredViewed.size()));

        Map<String, Object> stats = Map.of(
            "totalInquiries", totalInquiries,
            "totalViewed", totalViewed,
            "totalSaved", totalSaved,
            "activeChats", activeChats
        );
        
        Map<String, Object> responseMap = new java.util.LinkedHashMap<>();
        responseMap.put("buyerCredentialScore", credibilityScore);
        responseMap.put("buyerCredentialFactors", buyerCredentialFactors);
        responseMap.put("stats", stats);
        responseMap.put("properties", filteredSaved);
        responseMap.put("propertiesForYou", propertiesForYou);
        responseMap.put("recentlyViewed", responseRecentlyViewed);

        return ResponseEntity.ok(responseMap);
    }

    @GetMapping("/saved")
    public ResponseEntity<?> getSavedProperties() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Property> properties = propertyService.getSavedProperties(userId);
        
        String activeRole = "BUYER";
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            Map<?, ?> userMap = restTemplate.getForObject(
                "http://localhost:8003/api/users/internal/" + userId, Map.class);
            if (userMap != null) {
                activeRole = (String) userMap.get("activeRole");
            }
        } catch (Exception e) {
            System.err.println("Error fetching activeRole for saved properties filtering: " + e.getMessage());
        }
        
        final String finalActiveRole = activeRole;
        List<Property> filtered = properties.stream()
            .filter(p -> {
                if ("BUYER".equalsIgnoreCase(finalActiveRole)) {
                    return "SALE".equalsIgnoreCase(p.getListingType());
                } else if ("RENTAL_SEEKER".equalsIgnoreCase(finalActiveRole)) {
                    return "RENT".equalsIgnoreCase(p.getListingType()) || "LEASE".equalsIgnoreCase(p.getListingType());
                }
                return true;
            })
            .collect(java.util.stream.Collectors.toList());
            
        return ResponseEntity.ok(Map.of("properties", filtered));
    }

    @PostMapping("/saved/toggle/{propertyId}")
    public ResponseEntity<?> toggleSaveProperty(@PathVariable String propertyId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean saved = propertyService.toggleSaveProperty(userId, propertyId);
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(propertyService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Property property) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(propertyService.create(property, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Property property) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            return ResponseEntity.ok(propertyService.update(id, property, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            propertyService.delete(id, userId);
            return ResponseEntity.ok(Map.of("message", "Deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my-listings")
    public ResponseEntity<?> getMyListings() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(propertyService.getMyListings(userId));
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<?> incrementUnlockCount(@PathVariable String id) {
        try {
            return ResponseEntity.ok(propertyService.incrementUnlockCount(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<?> addReview(@PathVariable String id, @RequestBody Property.Review review) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        String buyerName = review.getBuyerName() != null ? review.getBuyerName() : "Verified Buyer";
        try {
            return ResponseEntity.ok(propertyService.addReview(id, review, userId, buyerName));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    // ── Internal endpoints for Manager/Admin services ──

    @GetMapping("/internal/all")
    public ResponseEntity<List<Property>> getAllInternal() {
        return ResponseEntity.ok(propertyService.getAll());
    }

    @GetMapping("/internal/status/{status}")
    public ResponseEntity<List<Property>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(propertyService.getByStatus(status));
    }

    @GetMapping("/internal/statuses")
    public ResponseEntity<List<Property>> getByStatuses(@RequestParam List<String> statuses) {
        return ResponseEntity.ok(propertyService.getByStatusIn(statuses));
    }

    @PutMapping("/internal/{id}/status")
    public ResponseEntity<Property> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(propertyService.updateStatus(id, body.get("status"), body.get("reason")));
    }

    @DeleteMapping("/internal/{id}")
    public ResponseEntity<?> deleteInternal(@PathVariable String id) {
        propertyService.deleteByAdmin(id);
        return ResponseEntity.ok(Map.of("message", "Property deleted"));
    }

    @GetMapping("/internal/count")
    public ResponseEntity<Long> getCount() {
        return ResponseEntity.ok(propertyService.getPropertyCount());
    }
}
