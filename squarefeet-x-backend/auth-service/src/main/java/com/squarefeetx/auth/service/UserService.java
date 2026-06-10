package com.squarefeetx.auth.service;

import com.squarefeetx.auth.dto.AuthDto;
import com.squarefeetx.auth.dto.UserResponse;
import com.squarefeetx.auth.entity.User;
import com.squarefeetx.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return AuthService.toResponse(user);
    }

    public UserResponse updateProfile(String userId, AuthDto.UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getName() != null) user.setName(req.getName());
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getEmail() != null && !req.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(req.getEmail())) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(req.getEmail());
        }

        userRepository.save(user);
        return AuthService.toResponse(user);
    }

    public UserResponse switchRole(String userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getRoles().contains(role)) {
            // Auto-grant RENTAL roles to existing users if they are requesting them
            if (role.equals("RENTAL_OWNER") || role.equals("RENTAL_SEEKER")) {
                List<String> mutableRoles = new ArrayList<>(user.getRoles() != null ? user.getRoles() : new ArrayList<>());
                if (!mutableRoles.contains("RENTAL_OWNER")) mutableRoles.add("RENTAL_OWNER");
                if (!mutableRoles.contains("RENTAL_SEEKER")) mutableRoles.add("RENTAL_SEEKER");
                user.setRoles(mutableRoles);
                userRepository.save(user);
            } else {
                throw new RuntimeException("User does not have role: " + role);
            }
        }

        user.setActiveRole(role);
        userRepository.save(user);
        return AuthService.toResponse(user);
    }

    public UserResponse updateAvatar(String userId, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        return AuthService.toResponse(user);
    }

    // ── Admin endpoints exposed internally ──

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(AuthService::toResponse)
                .collect(Collectors.toList());
    }

    public UserResponse updateUserDetails(String userId, String name, String email, String phone, List<String> roles, String activeRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (name != null) user.setName(name);
        if (email != null) user.setEmail(email);
        if (phone != null) user.setPhone(phone);
        if (roles != null) user.setRoles(roles);
        if (activeRole != null) user.setActiveRole(activeRole);
        userRepository.save(user);
        return AuthService.toResponse(user);
    }

    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }

    public List<UserResponse> getManagers() {
        return userRepository.findByRolesContaining("MANAGER").stream()
                .map(AuthService::toResponse)
                .collect(Collectors.toList());
    }

    public void assignCityToManager(String managerId, String city) {
        User user = userRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        if (!user.getCities().contains(city)) {
            user.getCities().add(city);
            userRepository.save(user);
        }
    }

    public void unassignCityFromManager(String managerId, String city) {
        User user = userRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        user.getCities().remove(city);
        userRepository.save(user);
    }

    public long getUserCount() {
        return userRepository.count();
    }

    public UserResponse createManager(String name, String email, String phone,
                                      String password, List<String> cities) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }
        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .name(name)
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .rawPassword(password)
                .activeRole("MANAGER")
                .roles(new ArrayList<>(List.of("MANAGER")))
                .cities(cities != null ? new ArrayList<>(cities) : new ArrayList<>())
                .build();
        userRepository.save(user);
        return AuthService.toResponse(user);
    }

    public Optional<UserResponse> getManagerByCity(String city) {
        List<User> managers = userRepository.findManagersByCity(city);
        if (managers.isEmpty()) {
            String cleanedCity = city.trim();
            String managerEmail = cleanedCity.toLowerCase().replaceAll("[^a-z0-9]", "") + "@squarefeetx.com";
            Optional<User> existingOpt = userRepository.findByEmail(managerEmail);
            User manager;
            if (existingOpt.isPresent()) {
                manager = existingOpt.get();
                List<String> userCities = manager.getCities();
                if (userCities == null) {
                    userCities = new ArrayList<>();
                } else {
                    userCities = new ArrayList<>(userCities);
                }
                if (!userCities.contains(cleanedCity)) {
                    userCities.add(cleanedCity);
                    manager.setCities(userCities);
                    userRepository.save(manager);
                }
            } else {
                manager = User.builder()
                        .id(UUID.randomUUID().toString())
                        .name("Manager - " + cleanedCity)
                        .email(managerEmail)
                        .phone("+91 99999 11111")
                        .passwordHash(passwordEncoder.encode("manager123"))
                        .rawPassword("manager123")
                        .activeRole("MANAGER")
                        .roles(new ArrayList<>(List.of("MANAGER")))
                        .cities(new ArrayList<>(List.of(cleanedCity)))
                        .build();
                userRepository.save(manager);
            }
            return Optional.of(AuthService.toResponse(manager));
        }
        return Optional.of(AuthService.toResponse(managers.get(0)));
    }

    public UserResponse getOrCreateGuest(String name, String email) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            return AuthService.toResponse(existing.get());
        }

        String randomPass = "GuestPass_" + UUID.randomUUID().toString().substring(0, 8);
        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .name(name)
                .email(email)
                .phone("Guest User")
                .passwordHash(passwordEncoder.encode(randomPass))
                .rawPassword(randomPass)
                .activeRole("BUYER")
                .roles(new ArrayList<>(List.of("BUYER", "SELLER", "RENTAL_OWNER", "RENTAL_SEEKER")))
                .cities(new ArrayList<>())
                .build();
        userRepository.save(user);
        return AuthService.toResponse(user);
    }
}
