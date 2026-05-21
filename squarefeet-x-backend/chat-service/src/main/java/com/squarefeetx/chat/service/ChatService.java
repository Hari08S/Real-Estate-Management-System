package com.squarefeetx.chat.service;

import com.squarefeetx.chat.model.Conversation;
import com.squarefeetx.chat.model.Message;
import com.squarefeetx.chat.repository.ConversationRepository;
import com.squarefeetx.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    public List<Conversation> getConversations(String userId) {
        return conversationRepository.findByParticipantsContaining(userId);
    }

    public List<Message> getMessages(String conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public Conversation startConversation(String userId, String otherUserId,
                                           String propertyId, String propertyTitle, String message) {
        List<Conversation> existing = conversationRepository.findByParticipantsContaining(userId);
        Conversation conv = existing.stream()
                .filter(c -> c.getParticipants().contains(otherUserId))
                .findFirst()
                .orElse(null);

        if (conv == null) {
            conv = Conversation.builder()
                    .participants(List.of(userId, otherUserId))
                    .propertyId(propertyId)
                    .propertyTitle(propertyTitle)
                    .lastMessage(message != null ? message : "")
                    .lastMessageAt(LocalDateTime.now())
                    .unreadCounts(Map.of(userId, 0, otherUserId, 1))
                    .createdAt(LocalDateTime.now())
                    .build();
            conv = conversationRepository.save(conv);
        } else {
            conv.setPropertyId(propertyId);
            conv.setPropertyTitle(propertyTitle);
            if (message != null && !message.isBlank()) {
                conv.setLastMessage(message);
                conv.setLastMessageAt(LocalDateTime.now());
                Map<String, Integer> counts = new HashMap<>(conv.getUnreadCounts() != null ? conv.getUnreadCounts() : Map.of());
                counts.put(otherUserId, counts.getOrDefault(otherUserId, 0) + 1);
                conv.setUnreadCounts(counts);
            }
            conv = conversationRepository.save(conv);
        }

        if (message != null && !message.isBlank()) {
            Message msg = Message.builder()
                    .conversationId(conv.getId())
                    .senderId(userId)
                    .content(message)
                    .createdAt(LocalDateTime.now())
                    .build();
            messageRepository.save(msg);
        }
        return conv;
    }

    public Message sendMessage(String conversationId, String senderId, String content) {
        Message msg = Message.builder()
                .conversationId(conversationId)
                .senderId(senderId)
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();
        messageRepository.save(msg);

        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        conv.setLastMessage(content);
        conv.setLastMessageAt(LocalDateTime.now());

        Map<String, Integer> counts = new HashMap<>(conv.getUnreadCounts() != null ? conv.getUnreadCounts() : Map.of());
        conv.getParticipants().stream()
                .filter(p -> !p.equals(senderId))
                .forEach(p -> counts.merge(p, 1, (a, b) -> a + b));
        conv.setUnreadCounts(counts);
        conversationRepository.save(conv);

        return msg;
    }

    public void markRead(String conversationId, String userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        Map<String, Integer> counts = new HashMap<>(conv.getUnreadCounts() != null ? conv.getUnreadCounts() : Map.of());
        counts.put(userId, 0);
        conv.setUnreadCounts(counts);
        conversationRepository.save(conv);
    }

    public int getUnreadCount(String userId) {
        return getConversations(userId).stream()
                .mapToInt(c -> c.getUnreadCounts() != null ? c.getUnreadCounts().getOrDefault(userId, 0) : 0)
                .sum();
    }
}
