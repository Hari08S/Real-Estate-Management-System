package com.squarefeetx.auth;

import com.squarefeetx.auth.entity.User;
import com.squarefeetx.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.List;

@SpringBootApplication
public class AuthServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(AuthServiceApplication.class, args);
	}

	@Bean
	public CommandLineRunner seedManagers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			List<String> states = List.of(
					"Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
					"Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
					"Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
					"Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
					"Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
					"Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
					"Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
					"Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
			);

			for (String state : states) {
				String cleanedState = state.trim();
				String email = cleanedState.toLowerCase().replaceAll("[^a-z0-9]", "") + "@squarefeetx.com";
				if (userRepository.findByEmail(email).isEmpty()) {
					User manager = User.builder()
							.name("Manager - " + cleanedState)
							.email(email)
							.phone("+91 99999 11111")
							.passwordHash(passwordEncoder.encode("manager123"))
							.rawPassword("manager123")
							.activeRole("MANAGER")
							.roles(new ArrayList<>(List.of("MANAGER")))
							.cities(new ArrayList<>(List.of(cleanedState)))
							.build();
					userRepository.save(manager);
				}
			}
		};
	}
}
