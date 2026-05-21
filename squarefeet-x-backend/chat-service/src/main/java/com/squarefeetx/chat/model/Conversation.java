package com.squarefeetx.chat.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.*;

@Document(collection = "conversations")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Conversation {
    @Id
    private String id;
    @Builder.Default
    private List<String> participants = new ArrayList<>();
    private String propertyId;
    private String propertyTitle;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    @Builder.Default
    private Map<String, Integer> unreadCounts = new HashMap<>();
    private LocalDateTime createdAt;
}
