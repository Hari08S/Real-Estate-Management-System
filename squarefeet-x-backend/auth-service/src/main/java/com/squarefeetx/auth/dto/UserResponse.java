package com.squarefeetx.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String activeRole;
    private List<String> roles;
    private String avatar;
    private List<String> cities;
    private LocalDateTime createdAt;
    private String rawPassword;
}
