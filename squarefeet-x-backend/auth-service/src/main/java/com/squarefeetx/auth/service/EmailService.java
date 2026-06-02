package com.squarefeetx.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@squarefeetx.com}")
    private String fromEmail;

    public void sendPasswordResetEmail(String to, String resetLink) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Password Reset Request - SquareFeet X");
            message.setText("To reset your password, click the link below:\n\n" + resetLink);
            
            if (mailSender != null) {
                new Thread(() -> {
                    try {
                        mailSender.send(message);
                        log.info("REAL EMAIL SENT TO: {}", to);
                    } catch (Exception e) {
                        log.error("Failed to send real reset email to {}", to, e);
                    }
                }).start();
            } else {
                log.info("MOCK EMAIL LOGGED (mailSender not configured) TO: {}", to);
            }
            log.info("RESET LINK: {}", resetLink);
        } catch (Exception e) {
            log.error("Failed to send email to {}", to, e);
        }
    }

    public void sendPasswordResetOtp(String to, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Password Reset OTP - SquareFeet X");
            message.setText("Your password reset OTP is: " + otp + "\n\nThis OTP is valid for 15 minutes.");
            
            if (mailSender != null) {
                new Thread(() -> {
                    try {
                        mailSender.send(message);
                        log.info("REAL OTP EMAIL SENT TO: {}", to);
                    } catch (Exception e) {
                        log.error("Failed to send real OTP email to {}", to, e);
                    }
                }).start();
            } else {
                log.info("MOCK OTP EMAIL LOGGED (mailSender not configured) TO: {}", to);
            }
            log.info("PASSWORD RESET OTP: {}", otp);
        } catch (Exception e) {
            log.error("Failed to send OTP to {}", to, e);
        }
    }
}
