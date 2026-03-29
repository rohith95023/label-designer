package com.pharmalabel.api.controllers;

import com.pharmalabel.api.dtos.user.CreateUserRequest;
import com.pharmalabel.api.dtos.user.UpdateUserRequest;
import com.pharmalabel.api.dtos.user.UserDto;
import com.pharmalabel.api.models.User;
import com.pharmalabel.api.services.AuditLogService;
import com.pharmalabel.api.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            UserDto created = userService.createUser(request);
            User currentUser = userService.getCurrentUser();
            auditLogService.logEvent(currentUser, "CREATE", "USERS", "USER_CREATED", null,
                    "Created user: " + created.getUsername() + " (role: " + created.getRole() + ")");
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("success", false);
            body.put("message", e.getMessage());
            body.put("errorType", "BUSINESS_ERROR");
            return ResponseEntity.ok(body);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request) {
        try {
            UserDto updated = userService.updateUser(id, request);
            User currentUser = userService.getCurrentUser();
            auditLogService.logEvent(currentUser, "UPDATE", "USERS", "USER_UPDATED", null,
                    "Updated user: " + updated.getUsername() + " (id: " + id + ")");
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("success", false);
            body.put("message", e.getMessage());
            body.put("errorType", "BUSINESS_ERROR");
            return ResponseEntity.ok(body);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        User currentUser = userService.getCurrentUser();
        userService.deleteUser(id);
        auditLogService.logEvent(currentUser, "DELETE", "USERS", "USER_DELETED", null,
                "Deleted user id: " + id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> lockUser(@PathVariable UUID id) {
        User currentUser = userService.getCurrentUser();
        userService.lockUser(id);
        auditLogService.logEvent(currentUser, "LOCK", "USERS", "USER_LOCKED", null,
                "Locked user id: " + id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unlockUser(@PathVariable UUID id) {
        User currentUser = userService.getCurrentUser();
        userService.unlockUser(id);
        auditLogService.logEvent(currentUser, "UNLOCK", "USERS", "USER_UNLOCKED", null,
                "Unlocked user id: " + id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<String>> getAllRoles() {
        return ResponseEntity.ok(userService.getAllRoles());
    }
}
