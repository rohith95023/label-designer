package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.Permission;
import com.pharmalabel.api.models.User;
import com.pharmalabel.api.services.AuditLogService;
import com.pharmalabel.api.services.PermissionService;
import com.pharmalabel.api.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;
    private final UserService userService;
    private final AuditLogService auditLogService;

    @GetMapping("/role/{roleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Permission>> getPermissionsByRole(@PathVariable UUID roleId) {
        return ResponseEntity.ok(permissionService.getPermissionsByRole(roleId));
    }

    @PatchMapping("/{permissionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updatePermission(@PathVariable UUID permissionId, @RequestBody Boolean allowed) {
        User currentUser = userService.getCurrentUser();
        permissionService.updatePermission(permissionId, allowed);
        auditLogService.logEvent(currentUser, "UPDATE", "PERMISSIONS", permissionId, null,
                "Permission set to allowed=" + allowed);
        return ResponseEntity.ok().build();
    }
}
