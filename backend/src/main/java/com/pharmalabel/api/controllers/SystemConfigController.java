package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.SystemConfig;
import com.pharmalabel.api.models.User;
import com.pharmalabel.api.services.AuditLogService;
import com.pharmalabel.api.services.SystemConfigService;
import com.pharmalabel.api.services.UserService;
import com.pharmalabel.api.repositories.SystemConfigRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/system-configs")
@RequiredArgsConstructor
public class SystemConfigController {

    private final SystemConfigService systemConfigService;
    private final SystemConfigRepository repository;
    private final UserService userService;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SystemConfig>> getAllConfigs() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemConfig> updateConfig(@RequestBody ConfigUpdateRequest request) {
        User currentUser = userService.getCurrentUser();
        SystemConfig systemConfig = systemConfigService.saveConfig(request.getKey(), request.getValue(), null);
        auditLogService.logEvent(currentUser, "UPDATE", "SYSTEM_CONFIG", "CONFIG_CHANGED", null,
                "Config '" + request.getKey() + "' set to '" + request.getValue() + "'");
        return ResponseEntity.ok(systemConfig);
    }

    @Data
    public static class ConfigUpdateRequest {
        private String key;
        private String value;
    }
}
