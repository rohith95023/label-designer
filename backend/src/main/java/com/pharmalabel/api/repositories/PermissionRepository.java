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
}
