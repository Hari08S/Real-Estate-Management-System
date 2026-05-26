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

    @GetMapping("/saved")
    public ResponseEntity<?> getSavedProperties() {
        return ResponseEntity.ok(Map.of(
            "totalInquiries", 0,
            "totalViewed", 0,
            "properties", List.of()
        ));
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
