package com.squarefeetx.auth.controller;

import com.squarefeetx.auth.dto.AuthDto;
import com.squarefeetx.auth.dto.UserResponse;
import com.squarefeetx.auth.service.AuthService;
import com.squarefeetx.auth.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Base64;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(Map.of("user", userService.getProfile(userId)));
    }

    @GetMapping("/admin-info")
    public ResponseEntity<?> getAdminInfo() {
        // Returns basic info about the admin user for display purposes
        return ResponseEntity.ok(userService.getAllUsers().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().contains("ADMIN"))
                .findFirst()
                .map(u -> Map.of("id", u.getId(), "name", u.getName(), "email", u.getEmail(), "activeRole", u.getActiveRole()))
                .orElse(Map.of("name", "Admin", "email", "admin@squarefeetx.com")));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody AuthDto.UpdateProfileRequest req) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(Map.of("user", userService.updateProfile(userId, req)));
    }

    @PutMapping("/switch-role")
    public ResponseEntity<?> switchRole(@RequestBody AuthDto.SwitchRoleRequest req,
                                         HttpServletResponse response) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        UserResponse user = userService.switchRole(userId, req.getRole());
        // Issue fresh JWT cookies with the updated activeRole
        authService.issueNewTokens(userId, user.getActiveRole(), response);
        return ResponseEntity.ok(Map.of("user", user));
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
            String mimeType = file.getContentType();
            String avatarUrl = "data:" + mimeType + ";base64," + base64Image;
            
            String userId = SecurityContextHolder.getContext().getAuthentication().getName();
            UserResponse updatedUser = userService.updateAvatar(userId, avatarUrl);
            
            return ResponseEntity.ok(Map.of("url", updatedUser.getAvatar(), "user", updatedUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to process image"));
        }
    }

    // ── Internal endpoints for other microservices ──

    @GetMapping("/internal/all")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/internal/get-or-create-guest")
    public ResponseEntity<UserResponse> getOrCreateGuest(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        return ResponseEntity.ok(userService.getOrCreateGuest(name, email));
    }

    @GetMapping("/internal/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getProfile(id));
    }

    @PutMapping("/internal/{id}/roles")
    public ResponseEntity<UserResponse> updateUserRoles(@PathVariable String id,
                                                        @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) body.get("roles");
        String activeRole = (String) body.get("activeRole");
        String name = (String) body.get("name");
        String email = (String) body.get("email");
        String phone = (String) body.get("phone");
        return ResponseEntity.ok(userService.updateUserDetails(id, name, email, phone, roles, activeRole));
    }

    @DeleteMapping("/internal/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    @GetMapping("/internal/managers")
    public ResponseEntity<List<UserResponse>> getManagers() {
        return ResponseEntity.ok(userService.getManagers());
    }

    @PostMapping("/internal/managers/assign")
    public ResponseEntity<?> assignCity(@RequestBody Map<String, String> body) {
        userService.assignCityToManager(body.get("managerId"), body.get("city"));
        return ResponseEntity.ok(Map.of("message", "Manager assigned"));
    }

    @PostMapping("/internal/managers/unassign")
    public ResponseEntity<?> unassignCity(@RequestBody Map<String, String> body) {
        userService.unassignCityFromManager(body.get("managerId"), body.get("city"));
        return ResponseEntity.ok(Map.of("message", "City unassigned from manager"));
    }

    @GetMapping("/internal/count")
    public ResponseEntity<Long> getUserCount() {
        return ResponseEntity.ok(userService.getUserCount());
    }

    @PostMapping("/internal/managers/create")
    public ResponseEntity<?> createManager(@RequestBody Map<String, Object> body) {
        try {
            String name     = (String) body.get("name");
            String email    = (String) body.get("email");
            String phone    = (String) body.get("phone");
            String password = (String) body.getOrDefault("password", "Manager@123");
            @SuppressWarnings("unchecked")
            List<String> cities = (List<String>) body.getOrDefault("cities", List.of());
            return ResponseEntity.ok(Map.of("manager", userService.createManager(name, email, phone, password, cities)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/internal/managers/by-city")
    public ResponseEntity<?> getManagerByCity(@RequestParam String city) {
        return userService.getManagerByCity(city)
                .<ResponseEntity<?>>map(m -> ResponseEntity.ok(Map.of("manager", m)))
                .orElseGet(() -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("manager", null);
                    return ResponseEntity.ok(response);
                });
    }
}
