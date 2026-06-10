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
		PortKiller.cleanPort(8003);
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

			// Add KCE user if not exists
			if (userRepository.findByEmail("717823p315@kce.ac.in").isEmpty()) {
				User kceUser = User.builder()
						.name("KCE User")
						.email("717823p315@kce.ac.in")
						.phone("+91 99999 99999")
						.passwordHash(passwordEncoder.encode("12345678"))
						.rawPassword("12345678")
						.activeRole("BUYER")
						.roles(new ArrayList<>(List.of("BUYER", "SELLER", "RENTAL_OWNER", "RENTAL_SEEKER")))
						.build();
				userRepository.save(kceUser);
			}
		};
	}
}

class PortKiller {
    public static void cleanPort(int port) {
        if (isPortInUse(port)) {
            System.out.println("Port " + port + " is already in use. Attempting to free it...");
            killProcessOnPort(port);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private static boolean isPortInUse(int port) {
        try (java.net.ServerSocket ignored = new java.net.ServerSocket(port)) {
            return false;
        } catch (java.io.IOException e) {
            return true;
        }
    }

    private static void killProcessOnPort(int port) {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("win")) {
                ProcessBuilder builder = new ProcessBuilder("cmd.exe", "/c", "netstat -ano | findstr LISTENING | findstr :" + port);
                Process process = builder.start();
                try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty()) continue;
                        String[] parts = line.split("\\s+");
                        if (parts.length > 1) {
                            String localAddress = parts[1];
                            if (localAddress.endsWith(":" + port)) {
                                String pid = parts[parts.length - 1];
                                long currentPid = ProcessHandle.current().pid();
                                if (Long.parseLong(pid) == currentPid) {
                                    continue;
                                }
                                System.out.println("Port " + port + " is held by PID " + pid + ". Terminating process...");
                                new ProcessBuilder("taskkill", "/F", "/PID", pid).start().waitFor();
                            }
                        }
                    }
                }
            } else {
                ProcessBuilder builder = new ProcessBuilder("sh", "-c", "lsof -t -i :" + port);
                Process process = builder.start();
                try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()))) {
                    String pid;
                    while ((pid = reader.readLine()) != null) {
                        pid = pid.trim();
                        if (!pid.isEmpty()) {
                            long currentPid = ProcessHandle.current().pid();
                            if (Long.parseLong(pid) == currentPid) {
                                continue;
                            }
                            System.out.println("Port " + port + " is held by PID " + pid + ". Terminating process...");
                            new ProcessBuilder("kill", "-9", pid).start().waitFor();
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to clean port " + port + ": " + e.getMessage());
        }
    }
}
