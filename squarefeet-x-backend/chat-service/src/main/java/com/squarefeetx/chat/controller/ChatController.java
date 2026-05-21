package com.squarefeetx.chat.controller;

import com.squarefeetx.chat.model.Conversation;
import com.squarefeetx.chat.model.Message;
import com.squarefeetx.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final RestTemplate restTemplate;

    @Value("${app.services.auth-url}")
    private String authServiceUrl;

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Conversation> convs = chatService.getConversations(userId);

        // Enrich each conversation with the other participant's name & avatar
        List<Map<String, Object>> enriched = convs.stream().map(conv -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", conv.getId());
            dto.put("propertyId", conv.getPropertyId());
            dto.put("propertyTitle", conv.getPropertyTitle());
            dto.put("lastMessage", conv.getLastMessage());
            dto.put("lastMessageAt", conv.getLastMessageAt());
            dto.put("createdAt", conv.getCreatedAt());
            dto.put("participants", conv.getParticipants());
            int unread = conv.getUnreadCounts() != null ? conv.getUnreadCounts().getOrDefault(userId, 0) : 0;
            dto.put("unreadCount", unread);

            // Resolve the OTHER participant's name
            String otherId = conv.getParticipants().stream()
                    .filter(p -> !p.equals(userId))
                    .findFirst().orElse(userId);
            dto.put("otherUserId", otherId);
            dto.put("otherUser", resolveUser(otherId));
            return dto;
        }).toList();

        return ResponseEntity.ok(Map.of("conversations", enriched));
    }

    @PostMapping("/conversations")
    public ResponseEntity<?> startConversation(@RequestBody Map<String, String> body) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Conversation conv = chatService.startConversation(
                userId,
                body.getOrDefault("otherUserId", ""),
                body.get("propertyId"),
                body.getOrDefault("propertyTitle", "Property"),
                body.get("message")
        );

        Map<String, Object> dto = new HashMap<>();
        dto.put("id", conv.getId());
        dto.put("propertyId", conv.getPropertyId());
        dto.put("propertyTitle", conv.getPropertyTitle());
        dto.put("lastMessage", conv.getLastMessage());
        dto.put("lastMessageAt", conv.getLastMessageAt());
        dto.put("createdAt", conv.getCreatedAt());
        dto.put("participants", conv.getParticipants());
        int unread = conv.getUnreadCounts() != null ? conv.getUnreadCounts().getOrDefault(userId, 0) : 0;
        dto.put("unreadCount", unread);

        String otherId = conv.getParticipants().stream()
                .filter(p -> !p.equals(userId))
                .findFirst().orElse(userId);
        dto.put("otherUserId", otherId);
        dto.put("otherUser", resolveUser(otherId));

        return ResponseEntity.ok(dto);
    }

    @PostMapping("/contact-admin")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> contactAdmin() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // 1. Fetch all users from auth-service to find the ADMIN
        String adminId = null;
        try {
            List<Map<String, Object>> users = restTemplate.getForObject(
                    authServiceUrl + "/api/users/internal/all", List.class);
            if (users != null) {
                for (Map<String, Object> u : users) {
                    List<String> roles = (List<String>) u.get("roles");
                    if (roles != null && roles.contains("ADMIN")) {
                        adminId = (String) u.get("id");
                        break;
                    }
                }
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to resolve admin: " + e.getMessage()));
        }

        if (adminId == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Admin not found"));
        }

        // 2. Start/get conversation with ADMIN
        Conversation conv = chatService.startConversation(
                userId,
                adminId,
                "admin-support",
                "Admin Support Channel",
                "Hi, I need support from the admin team."
        );

        // 3. Enrich and return
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", conv.getId());
        dto.put("propertyId", conv.getPropertyId());
        dto.put("propertyTitle", conv.getPropertyTitle());
        dto.put("lastMessage", conv.getLastMessage());
        dto.put("lastMessageAt", conv.getLastMessageAt());
        dto.put("createdAt", conv.getCreatedAt());
        dto.put("participants", conv.getParticipants());
        int unread = conv.getUnreadCounts() != null ? conv.getUnreadCounts().getOrDefault(userId, 0) : 0;
        dto.put("unreadCount", unread);
        dto.put("otherUserId", adminId);
        dto.put("otherUser", resolveUser(adminId));

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<?> getMessages(@PathVariable String id) {
        return ResponseEntity.ok(Map.of("messages", chatService.getMessages(id)));
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable String id, @RequestBody Map<String, String> body) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Message msg = chatService.sendMessage(id, userId, body.get("content"));
        return ResponseEntity.ok(msg);
    }

    @PutMapping("/conversations/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable String id) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        chatService.markRead(id, userId);
        return ResponseEntity.ok(Map.of());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(Map.of("count", chatService.getUnreadCount(userId)));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> resolveUser(String userId) {
        if (userId == null) return Map.of("name", "Unknown", "id", "");
        try {
            Map<String, Object> resp = (Map<String, Object>) restTemplate.getForObject(
                    authServiceUrl + "/api/users/internal/" + userId, Map.class);
            if (resp != null) {
                Map<String, Object> resolved = new HashMap<>();
                resolved.put("id", resp.getOrDefault("id", userId));
                resolved.put("name", resp.getOrDefault("name", "Unknown"));
                resolved.put("email", resp.getOrDefault("email", ""));
                resolved.put("phone", resp.getOrDefault("phone", ""));
                
                Object avatarVal = resp.get("avatar");
                if (avatarVal == null) avatarVal = resp.get("avatarUrl");
                if (avatarVal == null) avatarVal = "";
                resolved.put("avatar", avatarVal);

                resolved.put("activeRole", resp.getOrDefault("activeRole", ""));
                resolved.put("roles", resp.getOrDefault("roles", List.of()));
                return resolved;
            }
        } catch (Exception ignored) {}
        return Map.of("id", userId, "name", "Unknown", "email", "", "phone", "", "avatar", "", "activeRole", "", "roles", List.of());
    }
}
