package com.squarefeetx.chat.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "messages")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {
    @Id
    private String id;
    private String conversationId;
    private String senderId;
    private String content;
    private LocalDateTime createdAt;
}
