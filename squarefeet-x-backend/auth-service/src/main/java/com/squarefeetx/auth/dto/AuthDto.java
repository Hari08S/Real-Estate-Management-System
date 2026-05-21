package com.squarefeetx.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDto {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Phone is required")
        private String phone;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class GoogleAuthRequest {
        @NotBlank(message = "Email is required")
        @Email
        private String email;
        
        @NotBlank(message = "Name is required")
        private String name;
    }

    @Data
    public static class UpdateProfileRequest {
        private String name;
        private String phone;
        private String email;
    }

    @Data
    public static class SwitchRoleRequest {
        @NotBlank
        private String role;
    }

    @Data
    public static class ForgotPasswordRequest {
        @NotBlank @Email
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank @Size(min = 8)
        private String password;
    }
}
