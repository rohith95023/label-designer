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
        if (user == null) return false;

        // 1. Check user-specific permissions first
        java.util.Optional<Permission> userPermission = permissionRepository.findByUser_IdAndModuleAndEvent(user.getId(), module, event);
        if (userPermission.isPresent()) {
            return userPermission.get().getAllowed();
        }

        // 2. Fallback: Role-based permissions
        if (user.getRole() == null) return false;
        
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
    public List<Permission> getPermissionsByUser(UUID userId) {
        return permissionRepository.findByUser_Id(userId);
    }

    @Transactional
    public void saveUserPermissions(com.pharmalabel.api.models.User user, List<com.pharmalabel.api.dtos.user.PermissionRequestDto> permissions) {
        // Clear existing user-specific permissions
        List<Permission> existing = permissionRepository.findByUser_Id(user.getId());
        permissionRepository.deleteAll(existing);

        // Save new permissions
        if (permissions != null) {
            for (com.pharmalabel.api.dtos.user.PermissionRequestDto dto : permissions) {
                Permission p = Permission.builder()
                        .user(user)
                        .module(dto.getModule())
                        .event(dto.getEvent())
                        .allowed(dto.getAllowed())
                        .build();
                permissionRepository.save(p);
            }
        }
    }
}
