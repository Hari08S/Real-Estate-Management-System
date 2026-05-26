package com.squarefeetx.auth.controller;

import com.squarefeetx.auth.dto.AuthDto;
import com.squarefeetx.auth.dto.UserResponse;
import com.squarefeetx.auth.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthDto.RegisterRequest req) {
        try {
            UserResponse user = authService.register(req);
            return ResponseEntity.ok(Map.of("message", "Account created", "user", user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDto.LoginRequest req,
                                   HttpServletResponse response) {
        try {
            UserResponse user = authService.login(req, response);
            return ResponseEntity.ok(Map.of("user", user));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody AuthDto.GoogleAuthRequest req,
                                         HttpServletResponse response) {
        try {
            UserResponse user = authService.googleLogin(req, response);
            return ResponseEntity.ok(Map.of("message", "Google login successful", "user", user));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        authService.logout(response, userId);
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        try {
            String userId = SecurityContextHolder.getContext().getAuthentication().getName();
            UserResponse user = authService.getMe(userId);
            return ResponseEntity.ok(Map.of("user", user));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        try {
            String refreshToken = extractCookie(request, "refreshToken");
            UserResponse user = authService.refreshToken(refreshToken, response);
            return ResponseEntity.ok(Map.of("message", "Token refreshed", "user", user));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody AuthDto.ForgotPasswordRequest req) {
        try {
            String otp = authService.forgotPassword(req.getEmail());
            String resetLink = "http://localhost:5173/reset-password/" + otp;
            return ResponseEntity.ok(Map.of(
                "message", "Reset OTP sent to email",
                "otp", otp,
                "token", otp,
                "resetLink", resetLink
            ));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password/{token}")
    public ResponseEntity<?> resetPassword(@PathVariable String token,
                                           @Valid @RequestBody AuthDto.ResetPasswordRequest req) {
        try {
            authService.resetPassword(token, req.getPassword());
            return ResponseEntity.ok(Map.of("message", "Password reset successful"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (name.equals(cookie.getName())) return cookie.getValue();
            }
        }
        return null;
    }
}
