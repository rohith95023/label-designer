package com.pharmalabel.api.services;

import com.pharmalabel.api.models.Permission;
import com.pharmalabel.api.models.Role;
import com.pharmalabel.api.repositories.PermissionRepository;
import com.pharmalabel.api.repositories.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "permissions", key = "#user.id + '-' + #module + '-' + #event")
    public boolean hasAccess(com.pharmalabel.api.models.User user, String module, String event) {
        if (user == null || user.getRole() == null) return false;
        
        return permissionRepository.findByRole_Name(user.getRole().getName()).stream()
                .filter(p -> p.getModule().equalsIgnoreCase(module) && p.getEvent().equalsIgnoreCase(event))
                .findFirst()
                .map(Permission::getAllowed)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<Permission> getPermissionsByRole(UUID roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        return permissionRepository.findByRole(role);
    }

    @Transactional
    public void updatePermission(UUID permissionId, boolean allowed) {
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new RuntimeException("Permission not found"));
        permission.setAllowed(allowed);
        permissionRepository.save(permission);
    }

    @Transactional(readOnly = true)
    public List<Permission> getPermissionsByRoleName(String roleName) {
        return permissionRepository.findByRole_Name(roleName);
    }

    /**
     * Get role-based permissions for user
     */
    @Transactional
    public java.util.List<com.pharmalabel.api.dtos.user.PermissionRequestDto> getMergedPermissions(com.pharmalabel.api.models.User user) {
        java.util.List<com.pharmalabel.api.dtos.user.PermissionRequestDto> result = new java.util.ArrayList<>();
        
        if (user.getRole() != null) {
            getPermissionsByRoleName(user.getRole().getName()).forEach(p -> {
                result.add(com.pharmalabel.api.dtos.user.PermissionRequestDto.builder()
                        .module(p.getModule())
                        .event(p.getEvent())
                        .allowed(p.getAllowed())
                        .build());
            });
        }
        
        return result;
    }
}
