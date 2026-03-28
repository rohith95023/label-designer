package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.Permission;
import com.pharmalabel.api.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    List<Permission> findByRole(Role role);
    List<Permission> findByRole_Name(String roleName);
    List<Permission> findByUser_Id(UUID userId);
    java.util.Optional<Permission> findByUser_IdAndModuleAndEvent(UUID userId, String module, String event);
}
