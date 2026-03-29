package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.Permission;
import com.pharmalabel.api.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    List<Permission> findByRole(Role role);
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM permissions WHERE role_id IN (SELECT id FROM roles WHERE name = :roleName)", nativeQuery = true)
    List<Permission> findByRole_Name(@org.springframework.data.repository.query.Param("roleName") String roleName);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM permissions WHERE user_id = :userId", nativeQuery = true)
    List<Permission> findByUser_Id(@org.springframework.data.repository.query.Param("userId") UUID userId);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM permissions WHERE user_id = :userId AND module = :module AND event = :event LIMIT 1", nativeQuery = true)
    java.util.Optional<Permission> findByUser_IdAndModuleAndEvent(@org.springframework.data.repository.query.Param("userId") UUID userId, @org.springframework.data.repository.query.Param("module") String module, @org.springframework.data.repository.query.Param("event") String event);
}
