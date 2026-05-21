package com.squarefeetx.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @SuppressWarnings("unused") // Intentionally optional — enable when SMTP is configured
    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendPasswordResetEmail(String to, String resetLink) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@squarefeetx.com");
            message.setTo(to);
            message.setSubject("Password Reset Request - SquareFeet X");
            message.setText("To reset your password, click the link below:\n\n" + resetLink);
            
            // mailSender.send(message); // Uncomment when SMTP is configured
            
            log.info("MOCK EMAIL SENT TO: {}", to);
            log.info("RESET LINK: {}", resetLink);
        } catch (Exception e) {
            log.error("Failed to send email to {}", to, e);
        }
    }
}
