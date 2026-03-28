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
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;
    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserDto created = userService.createUser(request);
        User currentUser = userService.getCurrentUser();
        auditLogService.logEvent(currentUser, "CREATE", "USERS", "USER_CREATED", null,
                "Created user: " + created.getUsername() + " (role: " + created.getRole() + ")");
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request) {
        UserDto updated = userService.updateUser(id, request);
        User currentUser = userService.getCurrentUser();
        auditLogService.logEvent(currentUser, "UPDATE", "USERS", "USER_UPDATED", null,
                "Updated user: " + updated.getUsername() + " (id: " + id + ")");
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        User currentUser = userService.getCurrentUser();
        userService.deleteUser(id);
        auditLogService.logEvent(currentUser, "DELETE", "USERS", "USER_DELETED", null,
                "Deleted user id: " + id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/lock")
    public ResponseEntity<Void> lockUser(@PathVariable UUID id) {
        User currentUser = userService.getCurrentUser();
        userService.lockUser(id);
        auditLogService.logEvent(currentUser, "LOCK", "USERS", "USER_LOCKED", null,
                "Locked user id: " + id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<Void> unlockUser(@PathVariable UUID id) {
        User currentUser = userService.getCurrentUser();
        userService.unlockUser(id);
        auditLogService.logEvent(currentUser, "UNLOCK", "USERS", "USER_UNLOCKED", null,
                "Unlocked user id: " + id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/roles")
    public ResponseEntity<List<String>> getAllRoles() {
        return ResponseEntity.ok(userService.getAllRoles());
    }
}
