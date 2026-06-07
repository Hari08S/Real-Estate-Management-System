package com.squarefeetx.property.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.*;

@Document(collection = "properties")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property {
    @Id
    private String id;
    private String title;
    private String description;
    private String propertyType;
    private String listingType;    // SALE, RENT, LEASE
    private Double price;
    private Double monthlyRent;
    private Double securityDeposit;
    private Double leaseAmount;
    private Integer leaseDurationYears;
    private Double refundableDeposit;
    private String leaseConditions;
    private Integer leaseDurationMonths;
    private String availableFrom;
    private Boolean petFriendly;
    private Boolean maintenanceIncluded;
    private Integer bedrooms;
    private Integer bathrooms;
    private Integer area;
    private String furnishing;      // FURNISHED, SEMI_FURNISHED, UNFURNISHED
    private String reraStatus;      // APPROVED, PENDING
    private String floor;           // GROUND, LOW, MEDIUM, HIGH
    private String status;          // DRAFT, PENDING, UNDER_REVIEW, APPROVED, REJECTED, SOLD, RENTED
    private String sellerId;
    private String managerId;
    private Location location;
    @Builder.Default
    private List<String> images = new ArrayList<>();
    @Builder.Default
    private List<String> verificationDocuments = new ArrayList<>();
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();
    @Builder.Default
    private Integer views = 0;
    @Builder.Default
    private Integer unlockCount = 0;
    private Integer buyerPercent;
    private Integer avgTimeOnPage;
    private Double unlockFee;
    private String rejectionReason;

    @org.springframework.data.annotation.Transient
    private Double buyerInterestRate;

    @org.springframework.data.annotation.Transient
    private Integer seekersPercent;

    @com.fasterxml.jackson.annotation.JsonProperty("buyerInterestRate")
    public Double getBuyerInterestRate() {
        if (views == null || views == 0) {
            return 0.0;
        }
        double rate = ((double) (unlockCount != null ? unlockCount : 0) / views) * 100.0;
        return Math.round(rate * 10.0) / 10.0;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("seekersPercent")
    public Integer getSeekersPercent() {
        if (buyerPercent == null) {
            return 100;
        }
        return Math.max(0, 100 - buyerPercent);
    }

    @Builder.Default
    private Map<String, LocalDateTime> statusTimestamps = new HashMap<>();
    private SellerContact sellerContact;
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Location {
        private String address;
        private String city;
        private String state;
        private String pincode;
        private Double lat;
        private Double lng;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SellerContact {
        private String name;
        private String phone;
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Review {
        private String id;
        private String buyerId;
        private String buyerName;
        private Integer rating;
        private String comment;
        private LocalDateTime createdAt;
    }
}
