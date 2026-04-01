package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.User;
import com.pharmalabel.api.models.Role;
import com.pharmalabel.api.repositories.UserRepository;
import com.pharmalabel.api.repositories.RoleRepository;
import com.pharmalabel.api.services.UserService;
import com.pharmalabel.api.dtos.user.UserDto;
import com.pharmalabel.api.dtos.user.CreateUserRequest;
import com.pharmalabel.api.dtos.user.UpdateUserRequest;
import com.pharmalabel.api.services.PermissionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionService permissionService;

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
        return userRepository.findById(id)
                .filter(u -> !"DELETED".equals(u.getStatus()))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }


    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAllActive().stream()
                .map(user -> {
                    try {
                        return mapToDto(user);
                    } catch (Exception e) {
                        logger.error("Error mapping user {} to DTO: {}", user.getId(), e.getMessage());
                        // Return a partial DTO rather than failing the entire list
                        UserDto dto = new UserDto();
                        dto.setId(user.getId());
                        dto.setUsername(user.getUsername());
                        dto.setEmail(user.getEmail());
                        dto.setRole(user.getRole() != null ? user.getRole().getName() : "UNKNOWN");
                        dto.setStatus(user.getStatus() != null ? user.getStatus() : "UNKNOWN");
                        dto.setFailedLoginAttempts(user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0);
                        dto.setPermissions(List.of());
                        return dto;
                    }
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists: " + request.getUsername());
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists: " + request.getEmail());
        }

        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRole()));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .status("ACTIVE")
                .failedLoginAttempts(0)
                .mustChangePassword(true)
                .build();

        User saved = userRepository.save(user);

        return mapToDto(saved);
    }

    @Override
    @Transactional
    public UserDto updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .filter(u -> !"DELETED".equals(u.getStatus()))
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Email already exists: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setPasswordChangedAt(OffsetDateTime.now());
            user.setMustChangePassword(false); // admin explicitly set it, mark as changed
        }

        if (request.getRole() != null) {
            Role role = roleRepository.findByName(request.getRole())
                    .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRole()));
            user.setRole(role);
        }

        User saved = userRepository.save(user);

        return mapToDto(saved);
    }

    @Override
    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .filter(u -> !"DELETED".equals(u.getStatus()))
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        // Guard: cannot delete yourself
        User currentUser = getCurrentUser();
        if (currentUser.getId().equals(id)) {
            throw new RuntimeException("You cannot delete your own account");
        }

        // Guard: cannot delete the last active ADMIN
        if (user.getRole() != null && "ADMIN".equals(user.getRole().getName())) {
            long adminCount = userRepository.countActiveByRoleName("ADMIN");
            if (adminCount <= 1) {
                throw new RuntimeException("Cannot delete the last administrator account. Promote another user to ADMIN first.");
            }
        }

        // Soft-delete: set status=DELETED
        user.setStatus("DELETED");
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void lockUser(UUID id) {
        User user = userRepository.findById(id)
                .filter(u -> !"DELETED".equals(u.getStatus()))
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        // Guard: cannot lock yourself
        User currentUser = getCurrentUser();
        if (currentUser.getId().equals(id)) {
            throw new RuntimeException("You cannot lock your own account");
        }

        user.setStatus("LOCKED");
        user.setLockedUntil(OffsetDateTime.now().plusYears(100));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void unlockUser(UUID id) {
        User user = userRepository.findById(id)
                .filter(u -> !"DELETED".equals(u.getStatus()))
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        user.setStatus("ACTIVE");
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
    }

    @Override
    public List<String> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(Role::getName)
                .sorted()
                .collect(Collectors.toList());
    }

    private UserDto mapToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole() != null ? user.getRole().getName() : null);
        dto.setStatus(user.getStatus());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setPasswordChangedAt(user.getPasswordChangedAt());
        dto.setFailedLoginAttempts(user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0);
        dto.setLockedUntil(user.getLockedUntil());
        dto.setPermissions(permissionService.getMergedPermissions(user));
        return dto;
    }
}
