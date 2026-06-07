package com.squarefeetx.property.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "saved_properties")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedProperty {
    @Id
    private String id;
    private String userId;
    private String propertyId;
    private LocalDateTime createdAt;
}
