package com.squarefeetx.auth.service;

import com.squarefeetx.auth.dto.AuthDto;
import com.squarefeetx.auth.dto.UserResponse;
import com.squarefeetx.auth.entity.User;
import com.squarefeetx.auth.repository.UserRepository;
import com.squarefeetx.auth.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public UserResponse register(AuthDto.RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        boolean autoVerify = req.getEmail().endsWith("@example.com");

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .rawPassword(req.getPassword())
                .activeRole("BUYER")
                .roles(List.of("BUYER", "SELLER", "RENTAL_OWNER", "RENTAL_SEEKER"))
                .emailVerified(autoVerify)
                .emailVerificationOtp(autoVerify ? null : otp)
                .emailVerificationOtpExpiry(autoVerify ? null : LocalDateTime.now().plusMinutes(15))
                .build();

        userRepository.save(user);
        if (!autoVerify) {
            emailService.sendEmailVerificationOtp(user.getEmail(), otp);
        }
        return toResponse(user);
    }

    public UserResponse googleLogin(AuthDto.GoogleAuthRequest req, HttpServletResponse response) {
        User user = userRepository.findByEmail(req.getEmail()).orElse(null);
        if (user == null) {
            String randomPass = "GoogleAuth_" + java.util.UUID.randomUUID().toString().substring(0, 8);
            user = User.builder()
                    .name(req.getName())
                    .email(req.getEmail())
                    .phone("Google User")
                    .passwordHash(passwordEncoder.encode(randomPass))
                    .rawPassword(randomPass)
                    .activeRole("BUYER")
                    .roles(List.of("BUYER", "SELLER", "RENTAL_OWNER", "RENTAL_SEEKER"))
                    .emailVerified(true)
                    .build();
            user = userRepository.save(user);
        } else if (user.getEmailVerified() == null || !user.getEmailVerified()) {
            user.setEmailVerified(true);
            user = userRepository.save(user);
        }

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getActiveRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        setTokenCookies(response, accessToken, refreshToken);
        return toResponse(user);
    }

    public UserResponse login(AuthDto.LoginRequest req, HttpServletResponse response) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (user.getEmailVerified() != null && !user.getEmailVerified()) {
            throw new RuntimeException("Email not verified. Please verify your email first.");
        }

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getActiveRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        ensureStandardRoles(user);
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        setTokenCookies(response, accessToken, refreshToken);
        return toResponse(user);
    }

    public void logout(HttpServletResponse response, String userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setRefreshToken(null);
            userRepository.save(user);
        });
        clearTokenCookies(response);
    }

    public UserResponse getMe(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ensureStandardRoles(user);
        return toResponse(user);
    }

    private void ensureStandardRoles(User user) {
        boolean updated = false;
        if (user.getEmailVerified() == null) {
            user.setEmailVerified(true);
            updated = true;
        }

        List<String> mutableRoles = new ArrayList<>(user.getRoles() != null ? user.getRoles() : new ArrayList<>());
        
        if (mutableRoles.contains("ADMIN") && mutableRoles.size() > 1) {
            mutableRoles.clear();
            mutableRoles.add("ADMIN");
            updated = true;
        } else if (mutableRoles.contains("MANAGER") && mutableRoles.size() > 1) {
            mutableRoles.clear();
            mutableRoles.add("MANAGER");
            updated = true;
        } else if (mutableRoles.contains("BUYER") || mutableRoles.contains("SELLER")) {
            if (!mutableRoles.contains("BUYER")) { mutableRoles.add("BUYER"); updated = true; }
            if (!mutableRoles.contains("SELLER")) { mutableRoles.add("SELLER"); updated = true; }
            if (!mutableRoles.contains("RENTAL_OWNER")) { mutableRoles.add("RENTAL_OWNER"); updated = true; }
            if (!mutableRoles.contains("RENTAL_SEEKER")) { mutableRoles.add("RENTAL_SEEKER"); updated = true; }
        }
        
        if (updated) {
            if (user.getRoles() != null) {
                user.getRoles().clear();
                user.getRoles().addAll(mutableRoles);
            } else {
                user.setRoles(mutableRoles);
            }
            userRepository.save(user);
        }
    }

    public void verifyEmail(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            return;
        }

        if (user.getEmailVerificationOtp() == null || !user.getEmailVerificationOtp().equals(otp)) {
            throw new RuntimeException("Invalid verification OTP");
        }

        if (user.getEmailVerificationOtpExpiry() != null && user.getEmailVerificationOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification OTP has expired");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationOtp(null);
        user.setEmailVerificationOtpExpiry(null);
        userRepository.save(user);
    }

    public void resendVerificationOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new RuntimeException("Email is already verified");
        }

        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setEmailVerificationOtp(otp);
        user.setEmailVerificationOtpExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendEmailVerificationOtp(user.getEmail(), otp);
    }

    public String forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        // Generate 6-digit numeric OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setResetToken(otp);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15)); // OTP valid for 15 minutes
        userRepository.save(user);

        emailService.sendPasswordResetOtp(user.getEmail(), otp);
        return otp;
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset OTP"));

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset OTP has expired");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setRawPassword(newPassword);
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    public UserResponse refreshToken(String refreshTokenValue, HttpServletResponse response) {
        if (refreshTokenValue == null || !jwtUtil.isTokenValid(refreshTokenValue)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String userId = jwtUtil.getUserIdFromToken(refreshTokenValue);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!refreshTokenValue.equals(user.getRefreshToken())) {
            throw new RuntimeException("Refresh token mismatch");
        }

        String newAccessToken = jwtUtil.generateAccessToken(user.getId(), user.getActiveRole());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getId());

        user.setRefreshToken(newRefreshToken);
        userRepository.save(user);

        setTokenCookies(response, newAccessToken, newRefreshToken);
        return toResponse(user);
    }

    private void setTokenCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        Cookie accessCookie = new Cookie("accessToken", accessToken);
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge((int) (jwtUtil.getAccessTokenExpiry() / 1000));
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/api/auth/refresh-token");
        refreshCookie.setMaxAge((int) (jwtUtil.getRefreshTokenExpiry() / 1000));
        response.addCookie(refreshCookie);
    }

    private void clearTokenCookies(HttpServletResponse response) {
        Cookie accessCookie = new Cookie("accessToken", "");
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("refreshToken", "");
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/api/auth/refresh-token");
        refreshCookie.setMaxAge(0);
        response.addCookie(refreshCookie);
    }

    /**
     * Issues fresh JWT access + refresh tokens for the given user and role.
     * Called after switchRole so the browser immediately gets cookies with the new activeRole.
     */
    public void issueNewTokens(String userId, String activeRole, HttpServletResponse response) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newAccessToken = jwtUtil.generateAccessToken(user.getId(), activeRole);
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getId());

        user.setRefreshToken(newRefreshToken);
        userRepository.save(user);

        setTokenCookies(response, newAccessToken, newRefreshToken);
    }

    public static UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .activeRole(user.getActiveRole())
                .roles(user.getRoles())
                .avatar(user.getAvatarUrl())
                .cities(user.getCities())
                .createdAt(user.getCreatedAt())
                .rawPassword(user.getRawPassword())
                .emailVerified(user.getEmailVerified())
                .build();
    }
}
