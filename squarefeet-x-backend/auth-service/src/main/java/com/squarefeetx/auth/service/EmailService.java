package com.squarefeetx.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@squarefeetx.com}")
    private String fromEmail;

    @Value("${app.brevo.api-key:}")
    private String brevoApiKey;

    private void sendEmailViaBrevo(String to, String subject, String htmlContent) {
        if (brevoApiKey == null || brevoApiKey.trim().isEmpty()) {
            log.warn("Brevo API key is not configured. Falling back to Gmail SMTP or Mock logging.");
            return;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);
            headers.set("Accept", "application/json");

            Map<String, Object> payload = new HashMap<>();
            
            Map<String, String> sender = new HashMap<>();
            sender.put("name", "SquareFeet X");
            sender.put("email", fromEmail);
            payload.put("sender", sender);

            List<Map<String, String>> toList = new ArrayList<>();
            Map<String, String> recipient = new HashMap<>();
            recipient.put("email", to);
            toList.add(recipient);
            payload.put("to", toList);

            payload.put("subject", subject);
            payload.put("htmlContent", htmlContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            new Thread(() -> {
                try {
                    ResponseEntity<String> response = restTemplate.postForEntity(
                        "https://api.brevo.com/v3/smtp/email",
                        request,
                        String.class
                    );
                    log.info("REAL EMAIL SENT VIA BREVO TO: {}. Response: {}", to, response.getBody());
                } catch (Exception e) {
                    log.error("Failed to send real email via Brevo to {}", to, e);
                }
            }).start();
        } catch (Exception e) {
            log.error("Failed to construct/send Brevo email to {}", to, e);
        }
    }

    public void sendEmailVerificationOtp(String to, String otp) {
        String subject = "Email Verification OTP - SquareFeet X";
        String htmlContent = "<html><body style=\"font-family: Arial, sans-serif; color: #333;\">" +
                "<div style=\"max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;\">" +
                "<h2 style=\"color: #1a365d; text-align: center;\">Verify Your Email Address</h2>" +
                "<p>Thank you for registering with <strong>SquareFeet X</strong>. Please use the following One-Time Password (OTP) to complete your registration:</p>" +
                "<div style=\"font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 30px 0; padding: 15px; background-color: #f7fafc; border-radius: 6px; color: #2b6cb0;\">" +
                otp +
                "</div>" +
                "<p>This OTP is valid for 15 minutes. If you did not request this, you can safely ignore this email.</p>" +
                "<hr style=\"border: none; border-top: 1px solid #eee; margin: 20px 0;\" />" +
                "<p style=\"font-size: 12px; color: #718096; text-align: center;\">SquareFeet X &copy; 2026. Zero Commission Real Estate.</p>" +
                "</div></body></html>";

        log.info("PREPARING TO SEND VERIFICATION OTP TO: {}", to);
        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            sendEmailViaBrevo(to, subject, htmlContent);
        } else {
            // Fallback / Mock
            log.info("MOCK VERIFICATION OTP LOGGED (Brevo not configured) TO: {}", to);
            log.info("VERIFICATION OTP: {}", otp);
            
            // Or try Gmail SMTP fallback if configured
            if (mailSender != null) {
                try {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setFrom(fromEmail);
                    message.setTo(to);
                    message.setSubject(subject);
                    message.setText("Your email verification OTP is: " + otp + "\n\nThis OTP is valid for 15 minutes.");
                    new Thread(() -> mailSender.send(message)).start();
                    log.info("FALLBACK SMTP VERIFICATION OTP EMAIL SENT TO: {}", to);
                } catch (Exception e) {
                    log.error("Failed to send SMTP verification email to {}", to, e);
                }
            }
        }
    }

    public void sendPasswordResetEmail(String to, String resetLink) {
        String subject = "Password Reset Request - SquareFeet X";
        String htmlContent = "<html><body style=\"font-family: Arial, sans-serif;\">" +
                "<h3>Password Reset Request</h3>" +
                "<p>To reset your password, please click the link below:</p>" +
                "<p><a href=\"" + resetLink + "\" style=\"display: inline-block; padding: 10px 20px; background-color: #3182ce; color: white; text-decoration: none; border-radius: 5px;\">Reset Password</a></p>" +
                "<p>Or copy this link: " + resetLink + "</p>" +
                "</body></html>";

        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            sendEmailViaBrevo(to, subject, htmlContent);
        } else {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(to);
                message.setSubject(subject);
                message.setText("To reset your password, click the link below:\n\n" + resetLink);
                if (mailSender != null) {
                    new Thread(() -> mailSender.send(message)).start();
                }
                log.info("FALLBACK SMTP RESET LINK SENT/LOGGED TO: {}", to);
            } catch (Exception e) {
                log.error("Failed to send reset email to {}", to, e);
            }
        }
    }

    public void sendPasswordResetOtp(String to, String otp) {
        String subject = "Password Reset OTP - SquareFeet X";
        String htmlContent = "<html><body style=\"font-family: Arial, sans-serif; color: #333;\">" +
                "<div style=\"max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;\">" +
                "<h2 style=\"color: #e53e3e; text-align: center;\">Password Reset OTP</h2>" +
                "<p>You requested a password reset for your <strong>SquareFeet X</strong> account. Please use the following One-Time Password (OTP) to reset your password:</p>" +
                "<div style=\"font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 30px 0; padding: 15px; background-color: #fff5f5; border-radius: 6px; color: #c53030;\">" +
                otp +
                "</div>" +
                "<p>This OTP is valid for 15 minutes. If you did not make this request, please secure your account immediately.</p>" +
                "<hr style=\"border: none; border-top: 1px solid #eee; margin: 20px 0;\" />" +
                "<p style=\"font-size: 12px; color: #718096; text-align: center;\">SquareFeet X &copy; 2026. Zero Commission Real Estate.</p>" +
                "</div></body></html>";

        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            sendEmailViaBrevo(to, subject, htmlContent);
        } else {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(to);
                message.setSubject(subject);
                message.setText("Your password reset OTP is: " + otp + "\n\nThis OTP is valid for 15 minutes.");
                if (mailSender != null) {
                    new Thread(() -> mailSender.send(message)).start();
                }
                log.info("FALLBACK SMTP RESET OTP SENT/LOGGED TO: {}", to);
            } catch (Exception e) {
                log.error("Failed to send reset OTP to {}", to, e);
            }
        }
    }
}
