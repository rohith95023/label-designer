package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    @Query("SELECT u FROM User u WHERE u.username = :username AND u.status != 'DELETED'")
    Optional<User> findByUsername(@Param("username") String username);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.status != 'DELETED'")
    Optional<User> findByEmail(@Param("email") String email);

    // Return only non-deleted users for the management list
    @Query("SELECT u FROM User u WHERE u.status != 'DELETED'")
    List<User> findAllActive();

    // Count active admins (used for last-admin guard)
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = :roleName AND u.status != 'DELETED'")
    long countActiveByRoleName(@Param("roleName") String roleName);
}
