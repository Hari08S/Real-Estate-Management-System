package com.squarefeetx.property.service;

import com.squarefeetx.property.model.Property;
import com.squarefeetx.property.repository.PropertyRepository;
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
        Random r = new Random();
        if (property.getBuyerPercent() == null) {
            property.setBuyerPercent(50 + r.nextInt(31));
        }
        if (property.getAvgTimeOnPage() == null) {
            property.setAvgTimeOnPage(45 + r.nextInt(136));
        }
        return propertyRepository.save(property);
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
        Random r = new Random();
        property.setBuyerPercent(50 + r.nextInt(31));
        property.setAvgTimeOnPage(45 + r.nextInt(136));
        property.setCreatedAt(LocalDateTime.now());
        property.setStatusTimestamps(Map.of(
                "DRAFT", LocalDateTime.now(),
                "PENDING", LocalDateTime.now()
        ));
        return propertyRepository.save(property);
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
        if (updates.getImages() != null && !updates.getImages().isEmpty()) {
            existing.setImages(updates.getImages());
        }
        if (updates.getVerificationDocuments() != null && !updates.getVerificationDocuments().isEmpty()) {
            existing.setVerificationDocuments(updates.getVerificationDocuments());
        }
        if (updates.getReviews() != null && !updates.getReviews().isEmpty()) {
            existing.setReviews(updates.getReviews());
        }

        return propertyRepository.save(existing);
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
        return propertyRepository.save(property);
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
        Random r = new Random();
        for (Property p : properties) {
            boolean changed = false;
            if (p.getBuyerPercent() == null) {
                p.setBuyerPercent(50 + r.nextInt(31));
                changed = true;
            }
            if (p.getAvgTimeOnPage() == null) {
                p.setAvgTimeOnPage(45 + r.nextInt(136));
                changed = true;
            }
            if (changed) {
                propertyRepository.save(p);
            }
        }
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
        return propertyRepository.findByStatus(status);
    }

    public List<Property> getByStatusIn(List<String> statuses) {
        return propertyRepository.findByStatusIn(statuses);
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
        return propertyRepository.save(property);
    }

    public List<Property> getAll() {
        return propertyRepository.findAll();
    }

    public void deleteByAdmin(String id) {
        propertyRepository.deleteById(id);
    }

    public long getPropertyCount() {
        return propertyRepository.count();
    }
}
