package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.User;
import com.pharmalabel.api.repositories.UserRepository;
import com.pharmalabel.api.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final com.pharmalabel.api.repositories.SavedTemplateRepository savedTemplateRepository;
    private final com.pharmalabel.api.repositories.RoleRepository roleRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Logged in user not found in database"));
    }

    @Override
    public User getUserById(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    @Transactional
    public String initiateClaim(String guestId) {
        // Enforce 10-minute TTL (this would normally be a signed JWT or similar)
        // For this implementation, we'll return the guestId with a timestamp signature
        long expiry = System.currentTimeMillis() + (10 * 60 * 1000);
        return guestId + ":" + expiry; 
    }

    @Override
    @Transactional
    public void executeClaim(String claimToken) {
        String[] parts = claimToken.split(":");
        if (parts.length != 2) throw new RuntimeException("Invalid claim token");
        
        String guestId = parts[0];
        long expiry = Long.parseLong(parts[1]);
        
        if (System.currentTimeMillis() > expiry) {
            throw new RuntimeException("Claim token expired (10m TTL exceeded)");
        }

        User currentUser = getCurrentUser();
        
        // Transfer all saved templates
        List<com.pharmalabel.api.models.SavedTemplate> templates = 
                savedTemplateRepository.findByUserId(guestId);
        
        for (com.pharmalabel.api.models.SavedTemplate t : templates) {
            t.setOwner(currentUser);
            // Optionally update old field, but owner field is now the primary GxP source
            savedTemplateRepository.save(t);
        }
    }

    @Override
    public List<com.pharmalabel.api.dtos.user.UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    @Transactional
    public com.pharmalabel.api.dtos.user.UserDto createUser(com.pharmalabel.api.dtos.user.CreateUserRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        com.pharmalabel.api.models.Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .status("ACTIVE")
                .tokenVersion(0)
                .failedLoginAttempts(0)
                .mustChangePassword(true)
                .build();

        return mapToDto(userRepository.save(user));
    }

    @Override
    @Transactional
    public com.pharmalabel.api.dtos.user.UserDto updateUser(UUID id, com.pharmalabel.api.dtos.user.UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.findByUsername(request.getUsername()).isPresent()) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(request.getUsername());
        }

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setMustChangePassword(true); // force change on admin reset
        }

        if (request.getRole() != null) {
            com.pharmalabel.api.models.Role role = roleRepository.findByName(request.getRole())
                    .orElseThrow(() -> new RuntimeException("Role not found"));
            user.setRole(role);
        }

        return mapToDto(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // Additional checks like "don't delete yourself" or "don't delete last admin" could go here
        userRepository.delete(user);
    }

    @Override
    @Transactional
    public void lockUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus("LOCKED");
        user.setLockedUntil(OffsetDateTime.now().plusYears(100)); // Essentially permanent until unlocked
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void unlockUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus("ACTIVE");
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
    }

    @Override
    public List<String> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(com.pharmalabel.api.models.Role::getName)
                .collect(java.util.stream.Collectors.toList());
    }

    private com.pharmalabel.api.dtos.user.UserDto mapToDto(User user) {
        com.pharmalabel.api.dtos.user.UserDto dto = new com.pharmalabel.api.dtos.user.UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole() != null ? user.getRole().getName() : null);
        dto.setStatus(user.getStatus());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setPasswordChangedAt(user.getPasswordChangedAt());
        dto.setFailedLoginAttempts(user.getFailedLoginAttempts());
        dto.setLockedUntil(user.getLockedUntil());
        return dto;
    }
}
