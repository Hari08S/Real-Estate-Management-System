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

        return Map.of("properties", properties, "total", properties.size());
    }

    private double getEffectivePrice(Property p) {
        if (p.getPrice() != null) return p.getPrice();
        if (p.getMonthlyRent() != null) return p.getMonthlyRent();
        if (p.getLeaseAmount() != null) return p.getLeaseAmount();
        return 0;
    }

    public Property getById(String id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
    }

    public Property create(Property property, String sellerId) {
        property.setStatus("PENDING");
        property.setSellerId(sellerId);
        property.setViews(0);
        property.setUnlockCount(0);
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
        if (updates.getLocation() != null) existing.setLocation(updates.getLocation());
        if (updates.getImages() != null && !updates.getImages().isEmpty()) {
            existing.setImages(updates.getImages());
        }

        return propertyRepository.save(existing);
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
