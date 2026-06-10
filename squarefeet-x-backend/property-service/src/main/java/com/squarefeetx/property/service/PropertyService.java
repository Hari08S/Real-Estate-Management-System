package com.squarefeetx.property.service;

import com.squarefeetx.property.model.Property;
import com.squarefeetx.property.model.SavedProperty;
import com.squarefeetx.property.repository.PropertyRepository;
import com.squarefeetx.property.repository.SavedPropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.GrantedAuthority;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final SavedPropertyRepository savedPropertyRepository;
    private final org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

    private void populateSellerContact(Property property) {
        if (property == null || property.getSellerId() == null) return;
        try {
            String authServiceUrl = "http://localhost:8003/api/users/internal/" + property.getSellerId();
            org.springframework.http.ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    authServiceUrl,
                    org.springframework.http.HttpMethod.GET,
                    null,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> userMap = response.getBody();
                String name = (String) userMap.get("name");
                String phone = (String) userMap.get("phone");
                String email = (String) userMap.get("email");
                property.setSellerContact(Property.SellerContact.builder()
                        .name(name)
                        .phone(phone)
                        .email(email)
                        .build());
            }
        } catch (Exception e) {
            System.err.println("Error fetching seller details for id " + property.getSellerId() + ": " + e.getMessage());
        }
    }

    private void populateSellerContacts(List<Property> properties) {
        if (properties == null || properties.isEmpty()) return;
        Set<String> sellerIds = properties.stream()
                .map(Property::getSellerId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        Map<String, Property.SellerContact> contactMap = new HashMap<>();
        for (String sellerId : sellerIds) {
            try {
                String authServiceUrl = "http://localhost:8003/api/users/internal/" + sellerId;
                org.springframework.http.ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                        authServiceUrl,
                        org.springframework.http.HttpMethod.GET,
                        null,
                        new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
                );
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map<String, Object> userMap = response.getBody();
                    String name = (String) userMap.get("name");
                    String phone = (String) userMap.get("phone");
                    String email = (String) userMap.get("email");
                    contactMap.put(sellerId, Property.SellerContact.builder()
                            .name(name)
                            .phone(phone)
                            .email(email)
                            .build());
                }
            } catch (Exception e) {
                System.err.println("Error fetching seller details for id " + sellerId + ": " + e.getMessage());
            }
        }
        
        for (Property p : properties) {
            if (p.getSellerId() != null && contactMap.containsKey(p.getSellerId())) {
                p.setSellerContact(contactMap.get(p.getSellerId()));
            }
        }
    }

    private void populateUnlockStatus(Property property) {
        if (property == null) return;
        
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            property.setIsUnlocked(false);
            return;
        }
        
        String currentUserId = auth.getName();
        
        // 1. Is user the owner (seller)?
        if (currentUserId.equals(property.getSellerId())) {
            property.setIsUnlocked(true);
            return;
        }
        
        // 2. Is user Admin or Manager?
        boolean isAdminOrManager = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> "ROLE_ADMIN".equals(role) || "ROLE_MANAGER".equals(role));
        if (isAdminOrManager) {
            property.setIsUnlocked(true);
            return;
        }
        
        // 3. Does a conversation exist containing this propertyId and currentUserId?
        try {
            org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("propertyId").is(property.getId())
                    .and("participants").in(currentUserId));
            boolean hasConversation = mongoTemplate.exists(query, "conversations");
            property.setIsUnlocked(hasConversation);
        } catch (Exception e) {
            System.err.println("Error checking unlock status for property " + property.getId() + ": " + e.getMessage());
            property.setIsUnlocked(false);
        }
    }

    private void populateUnlockStatuses(List<Property> properties) {
        if (properties == null || properties.isEmpty()) return;
        
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            for (Property p : properties) {
                p.setIsUnlocked(false);
            }
            return;
        }
        
        String currentUserId = auth.getName();
        boolean isAdminOrManager = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> "ROLE_ADMIN".equals(role) || "ROLE_MANAGER".equals(role));
        
        if (isAdminOrManager) {
            for (Property p : properties) {
                p.setIsUnlocked(true);
            }
            return;
        }
        
        // Query all conversation propertyIds for this user
        Set<String> unlockedPropertyIds = new HashSet<>();
        try {
            org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("participants").in(currentUserId));
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> convs = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class, "conversations");
            for (Map<String, Object> conv : convs) {
                String pid = (String) conv.get("propertyId");
                if (pid != null) {
                    unlockedPropertyIds.add(pid);
                }
            }
        } catch (Exception e) {
            System.err.println("Error fetching user conversations for unlock status: " + e.getMessage());
        }
        
        for (Property p : properties) {
            if (currentUserId.equals(p.getSellerId()) || unlockedPropertyIds.contains(p.getId())) {
                p.setIsUnlocked(true);
            } else {
                p.setIsUnlocked(false);
            }
        }
    }

    public Map<String, Object> getAllApproved(Map<String, String> params) {
        List<Property> properties = propertyRepository.findByStatus("APPROVED");

        // Search
        String search = params.get("search");
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            properties = properties.stream().filter(p ->
                    (p.getTitle() != null && p.getTitle().toLowerCase().contains(q)) ||
                    (p.getLocation() != null && p.getLocation().getCity() != null &&
                     p.getLocation().getCity().toLowerCase().contains(q)) ||
                    (p.getLocation() != null && p.getLocation().getAddress() != null &&
                     p.getLocation().getAddress().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        // Filter by propertyType
        String propertyType = params.get("propertyType");
        if (propertyType != null && !propertyType.isBlank()) {
            properties = properties.stream()
                    .filter(p -> propertyType.equals(p.getPropertyType()))
                    .collect(Collectors.toList());
        }

        // Filter by listingType
        String listingType = params.get("listingType");
        if (listingType != null && !listingType.isBlank()) {
            List<String> types = List.of(listingType.split(","));
            properties = properties.stream()
                    .filter(p -> types.contains(p.getListingType()))
                    .collect(Collectors.toList());
        }

        // Price range
        String minPrice = params.get("minPrice");
        if (minPrice != null && !minPrice.isBlank()) {
            double min = Double.parseDouble(minPrice);
            properties = properties.stream()
                    .filter(p -> getEffectivePrice(p) >= min)
                    .collect(Collectors.toList());
        }
        String maxPrice = params.get("maxPrice");
        if (maxPrice != null && !maxPrice.isBlank()) {
            double max = Double.parseDouble(maxPrice);
            properties = properties.stream()
                    .filter(p -> getEffectivePrice(p) <= max)
                    .collect(Collectors.toList());
        }

        // Bedrooms
        String bedrooms = params.get("bedrooms");
        if (bedrooms != null && !bedrooms.isBlank()) {
            int b = Integer.parseInt(bedrooms);
            properties = properties.stream()
                    .filter(p -> p.getBedrooms() != null && p.getBedrooms() >= b)
                    .collect(Collectors.toList());
        }

        // Furnishing
        String furnishing = params.get("furnishing");
        if (furnishing != null && !furnishing.isBlank()) {
            properties = properties.stream()
                    .filter(p -> furnishing.equalsIgnoreCase(p.getFurnishing()))
                    .collect(Collectors.toList());
        }

        // RERA Status
        String reraStatus = params.get("reraStatus");
        if (reraStatus != null && !reraStatus.isBlank()) {
            properties = properties.stream()
                    .filter(p -> reraStatus.equalsIgnoreCase(p.getReraStatus()))
                    .collect(Collectors.toList());
        }

        // Floor
        String floor = params.get("floor");
        if (floor != null && !floor.isBlank()) {
            properties = properties.stream()
                    .filter(p -> floor.equalsIgnoreCase(p.getFloor()))
                    .collect(Collectors.toList());
        }

        // Distance from pinned point
        String distance = params.get("distance");
        String pinnedLat = params.get("pinnedLat");
        String pinnedLng = params.get("pinnedLng");
        if (distance != null && !distance.isBlank() && pinnedLat != null && !pinnedLat.isBlank() && pinnedLng != null && !pinnedLng.isBlank()) {
            double distKm = Double.parseDouble(distance);
            double lat = Double.parseDouble(pinnedLat);
            double lng = Double.parseDouble(pinnedLng);
            properties = properties.stream()
                    .filter(p -> p.getLocation() != null && p.getLocation().getLat() != null && p.getLocation().getLng() != null
                            && calculateDistance(lat, lng, p.getLocation().getLat(), p.getLocation().getLng()) <= distKm)
                    .collect(Collectors.toList());
        }

        populateSellerContacts(properties);
        populateUnlockStatuses(properties);
        return Map.of("properties", properties, "total", properties.size());
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private double getEffectivePrice(Property p) {
        if (p.getPrice() != null) return p.getPrice();
        if (p.getMonthlyRent() != null) return p.getMonthlyRent();
        if (p.getLeaseAmount() != null) return p.getLeaseAmount();
        return 0;
    }

    public Property getById(String id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        property.setViews((property.getViews() != null ? property.getViews() : 0) + 1);
        Property saved = propertyRepository.save(property);
        populateSellerContact(saved);
        populateUnlockStatus(saved);

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            recordPropertyView(auth.getName(), id);
        }

        return saved;
    }

    public Property incrementUnlockCount(String id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        property.setUnlockCount((property.getUnlockCount() != null ? property.getUnlockCount() : 0) + 1);
        return propertyRepository.save(property);
    }

    public Property create(Property property, String sellerId) {
        property.setStatus("PENDING");
        property.setSellerId(sellerId);
        property.setViews(0);
        property.setUnlockCount(0);
        property.setBuyerPercent(0);
        property.setAvgTimeOnPage(0);
        property.setCreatedAt(LocalDateTime.now());
        property.setStatusTimestamps(Map.of(
                "DRAFT", LocalDateTime.now(),
                "PENDING", LocalDateTime.now()
        ));
        Property saved = propertyRepository.save(property);
        populateSellerContact(saved);
        populateUnlockStatus(saved);
        return saved;
    }

    public Property update(String id, Property updates, String userId) {
        Property existing = getById(id);
        boolean isAdminOrManager = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> "ROLE_ADMIN".equals(role) || "ROLE_MANAGER".equals(role));
        if (!existing.getSellerId().equals(userId) && !isAdminOrManager) {
            throw new RuntimeException("Unauthorized: not the owner");
        }

        if (!isAdminOrManager && ("REJECTED".equals(existing.getStatus()) || "DRAFT".equals(existing.getStatus()))) {
            existing.setStatus("PENDING");
            existing.setRejectionReason(null);
            Map<String, LocalDateTime> timestamps = new HashMap<>(
                    existing.getStatusTimestamps() != null ? existing.getStatusTimestamps() : Map.of()
            );
            timestamps.put("PENDING", LocalDateTime.now());
            existing.setStatusTimestamps(timestamps);
        }

        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getPropertyType() != null) existing.setPropertyType(updates.getPropertyType());
        if (updates.getListingType() != null) existing.setListingType(updates.getListingType());
        if (updates.getPrice() != null) existing.setPrice(updates.getPrice());
        if (updates.getMonthlyRent() != null) existing.setMonthlyRent(updates.getMonthlyRent());
        if (updates.getSecurityDeposit() != null) existing.setSecurityDeposit(updates.getSecurityDeposit());
        if (updates.getLeaseAmount() != null) existing.setLeaseAmount(updates.getLeaseAmount());
        if (updates.getBedrooms() != null) existing.setBedrooms(updates.getBedrooms());
        if (updates.getBathrooms() != null) existing.setBathrooms(updates.getBathrooms());
        if (updates.getArea() != null) existing.setArea(updates.getArea());
        if (updates.getFurnishing() != null) existing.setFurnishing(updates.getFurnishing());
        if (updates.getReraStatus() != null) existing.setReraStatus(updates.getReraStatus());
        if (updates.getFloor() != null) existing.setFloor(updates.getFloor());
        if (updates.getLocation() != null) existing.setLocation(updates.getLocation());
        if (updates.getLeaseDurationYears() != null) existing.setLeaseDurationYears(updates.getLeaseDurationYears());
        if (updates.getRefundableDeposit() != null) existing.setRefundableDeposit(updates.getRefundableDeposit());
        if (updates.getLeaseConditions() != null) existing.setLeaseConditions(updates.getLeaseConditions());
        if (updates.getLeaseDurationMonths() != null) existing.setLeaseDurationMonths(updates.getLeaseDurationMonths());
        if (updates.getAvailableFrom() != null) existing.setAvailableFrom(updates.getAvailableFrom());
        if (updates.getPetFriendly() != null) existing.setPetFriendly(updates.getPetFriendly());
        if (updates.getMaintenanceIncluded() != null) existing.setMaintenanceIncluded(updates.getMaintenanceIncluded());
        if (updates.getViews() != null) existing.setViews(updates.getViews());
        if (updates.getUnlockCount() != null) existing.setUnlockCount(updates.getUnlockCount());
        if (updates.getBuyerPercent() != null) existing.setBuyerPercent(updates.getBuyerPercent());
        if (updates.getAvgTimeOnPage() != null) existing.setAvgTimeOnPage(updates.getAvgTimeOnPage());
        if (updates.getImages() != null && !updates.getImages().isEmpty()) {
            existing.setImages(updates.getImages());
        }
        if (updates.getVerificationDocuments() != null && !updates.getVerificationDocuments().isEmpty()) {
            existing.setVerificationDocuments(updates.getVerificationDocuments());
        }
        if (updates.getReviews() != null && !updates.getReviews().isEmpty()) {
            existing.setReviews(updates.getReviews());
        }

        Property saved = propertyRepository.save(existing);
        populateSellerContact(saved);
        populateUnlockStatus(saved);
        return saved;
    }

    public Property addReview(String id, Property.Review review, String buyerId, String buyerName) {
        Property property = getById(id);
        review.setId(UUID.randomUUID().toString());
        review.setBuyerId(buyerId);
        review.setBuyerName(buyerName);
        review.setCreatedAt(LocalDateTime.now());
        if (property.getReviews() == null) {
            property.setReviews(new ArrayList<>());
        }
        property.getReviews().add(review);
        Property saved = propertyRepository.save(property);
        populateSellerContact(saved);
        populateUnlockStatus(saved);
        return saved;
    }

    public void delete(String id, String userId) {
        Property property = getById(id);
        boolean isAdminOrManager = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> "ROLE_ADMIN".equals(role) || "ROLE_MANAGER".equals(role));
        if (!property.getSellerId().equals(userId) && !isAdminOrManager) {
            throw new RuntimeException("Unauthorized: not the owner");
        }
        propertyRepository.deleteById(id);
    }

    public Map<String, Object> getMyListings(String sellerId) {
        List<Property> properties = propertyRepository.findBySellerId(sellerId);
        populateSellerContacts(properties);
        populateUnlockStatuses(properties);
        Map<String, Object> stats = Map.of(
                "totalListings", properties.size(),
                "activeListings", properties.stream().filter(p -> "APPROVED".equals(p.getStatus())).count(),
                "totalViews", properties.stream().mapToInt(p -> p.getViews() != null ? p.getViews() : 0).sum(),
                "totalInquiries", properties.stream().mapToInt(p -> p.getUnlockCount() != null ? p.getUnlockCount() : 0).sum()
        );
        return Map.of("properties", properties, "stats", stats);
    }

    // ── Internal endpoints for Manager/Admin services ──

    public List<Property> getByStatus(String status) {
        List<Property> properties = propertyRepository.findByStatus(status);
        populateSellerContacts(properties);
        populateUnlockStatuses(properties);
        return properties;
    }

    public List<Property> getByStatusIn(List<String> statuses) {
        List<Property> properties = propertyRepository.findByStatusIn(statuses);
        populateSellerContacts(properties);
        populateUnlockStatuses(properties);
        return properties;
    }

    public Property updateStatus(String id, String status, String reason) {
        Property property = getById(id);
        property.setStatus(status);
        if (reason != null) property.setRejectionReason(reason);
        Map<String, LocalDateTime> timestamps = new HashMap<>(
                property.getStatusTimestamps() != null ? property.getStatusTimestamps() : Map.of()
        );
        timestamps.put(status, LocalDateTime.now());
        property.setStatusTimestamps(timestamps);
        Property saved = propertyRepository.save(property);
        populateSellerContact(saved);
        populateUnlockStatus(saved);
        return saved;
    }

    public List<Property> getAll() {
        List<Property> properties = propertyRepository.findAll();
        populateSellerContacts(properties);
        populateUnlockStatuses(properties);
        return properties;
    }

    public void deleteByAdmin(String id) {
        propertyRepository.deleteById(id);
    }

    public long getPropertyCount() {
        return propertyRepository.count();
    }

    public List<Property> getSavedProperties(String userId) {
        System.out.println("getSavedProperties called for userId: " + userId);
        List<SavedProperty> saved = savedPropertyRepository.findByUserId(userId);
        if (saved == null) {
            saved = Collections.emptyList();
        }
        System.out.println("Found saved properties count: " + saved.size());
        saved.forEach(s -> System.out.println(" - SavedProperty: " + s.getPropertyId() + " for user: " + s.getUserId()));
        List<String> propertyIds = saved.stream().map(SavedProperty::getPropertyId).toList();
        System.out.println("Property IDs to fetch: " + propertyIds);
        Iterable<Property> iterable = propertyRepository.findAllById(propertyIds);
        List<Property> list = new ArrayList<>();
        iterable.forEach(list::add);
        System.out.println("Fetched properties count: " + list.size());
        populateSellerContacts(list);
        populateUnlockStatuses(list);
        return list;
    }

    public boolean toggleSaveProperty(String userId, String propertyId) {
        Optional<SavedProperty> existing = savedPropertyRepository.findByUserIdAndPropertyId(userId, propertyId);
        if (existing.isPresent()) {
            savedPropertyRepository.delete(existing.get());
            return false;
        } else {
            savedPropertyRepository.save(SavedProperty.builder()
                    .userId(userId)
                    .propertyId(propertyId)
                    .createdAt(LocalDateTime.now())
                    .build());
            return true;
        }
    }

    public long getSavedPropertiesCount(String userId) {
        return savedPropertyRepository.countByUserId(userId);
    }

    private void recordPropertyView(String userId, String propertyId) {
        if (userId == null || propertyId == null || "anonymousUser".equals(userId)) return;
        try {
            org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("userId").is(userId)
                    .and("propertyId").is(propertyId));
            boolean exists = mongoTemplate.exists(query, "viewed_properties");
            if (!exists) {
                Map<String, Object> viewed = new HashMap<>();
                viewed.put("userId", userId);
                viewed.put("propertyId", propertyId);
                viewed.put("viewedAt", LocalDateTime.now());
                mongoTemplate.save(viewed, "viewed_properties");
            }
        } catch (Exception e) {
            System.err.println("Error recording property view: " + e.getMessage());
        }
    }

    public long getViewedPropertiesCount(String userId) {
        if (userId == null || "anonymousUser".equals(userId)) return 0;
        try {
            org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("userId").is(userId));
            return mongoTemplate.count(query, "viewed_properties");
        } catch (Exception e) {
            System.err.println("Error counting viewed properties: " + e.getMessage());
            return 0;
        }
    }

    public List<Property> getRecentlyViewedProperties(String userId, int limit) {
        if (userId == null || "anonymousUser".equals(userId)) return List.of();
        try {
            org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("userId").is(userId));
            query.with(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "viewedAt"));
            query.limit(limit);
            List<?> list = mongoTemplate.find(query, Map.class, "viewed_properties");
            List<String> propertyIds = list.stream()
                    .map(m -> {
                        if (m instanceof Map<?, ?> map) {
                            return (String) map.get("propertyId");
                        }
                        return null;
                    })
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .collect(java.util.stream.Collectors.toList());
            if (propertyIds.isEmpty()) return List.of();
            
            // Fetch properties
            List<Property> properties = propertyRepository.findAllById(propertyIds);
            
            // Map by ID for quick lookup and preserving order
            Map<String, Property> propMap = properties.stream()
                    .collect(java.util.stream.Collectors.toMap(Property::getId, p -> p, (p1, p2) -> p1));
            
            return propertyIds.stream()
                    .map(propMap::get)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error fetching recently viewed properties: " + e.getMessage());
            return List.of();
        }
    }
}

