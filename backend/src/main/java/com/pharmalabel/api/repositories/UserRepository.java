package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsernameAndDeletedAtIsNull(String username);
    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    // Backwards-compat wrappers used by auth flow
    default Optional<User> findByUsername(String username) {
        return findByUsernameAndDeletedAtIsNull(username);
    }
    default Optional<User> findByEmail(String email) {
        return findByEmailAndDeletedAtIsNull(email);
    }

    // Return only non-deleted users for the management list
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL")
    List<User> findAllActive();

    // Count active admins (used for last-admin guard)
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = :roleName AND u.deletedAt IS NULL")
    long countActiveByRoleName(@Param("roleName") String roleName);
}
