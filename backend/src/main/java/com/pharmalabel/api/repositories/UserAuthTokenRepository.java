package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.User;
import com.pharmalabel.api.models.UserAuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserAuthTokenRepository extends JpaRepository<UserAuthToken, UUID> {
    Optional<UserAuthToken> findByTokenHash(String tokenHash);
    List<UserAuthToken> findByFamilyId(UUID familyId);
    List<UserAuthToken> findByUser(User user);
}
