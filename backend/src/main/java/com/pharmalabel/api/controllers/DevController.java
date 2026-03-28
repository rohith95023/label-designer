package com.pharmalabel.api.controllers;

import com.pharmalabel.api.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/dev")
@RequiredArgsConstructor
public class DevController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Temporary dev-only endpoint. Used to reset admin password using the real BCryptPasswordEncoder.
     * REMOVE BEFORE PRODUCTION.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "admin");
        String newPassword = body.get("newPassword");

        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "newPassword is required"));
        }

        return userRepository.findByUsername(username)
            .map(user -> {
                user.setPasswordHash(passwordEncoder.encode(newPassword));
                user.setMustChangePassword(false);
                user.setFailedLoginAttempts(0);
                user.setLockedUntil(null);
                userRepository.save(user);
                return ResponseEntity.ok(Map.of(
                    "message", "Password reset successfully",
                    "username", username
                ));
            })
            .orElse(ResponseEntity.notFound().<Map<String, String>>build());
    }
}
