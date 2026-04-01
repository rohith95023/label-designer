package com.pharmalabel.api.services;

import com.pharmalabel.api.dtos.signature.ElectronicSignatureRequest;
import com.pharmalabel.api.models.AuditLog;
import com.pharmalabel.api.models.ElectronicSignature;
import com.pharmalabel.api.models.User;
import com.pharmalabel.api.repositories.ElectronicSignatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class SignatureService {

    private final ElectronicSignatureRepository repository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Transactional
    public ElectronicSignature sign(ElectronicSignatureRequest request, String ipAddress) {
        User currentUser = userService.getCurrentUser();

        // 21 CFR Part 11 Requirement: Verify password matches the current user
        if (!passwordEncoder.matches(request.getPassword(), currentUser.getPasswordHash())) {
            throw new RuntimeException("Invalid password. Electronic signature verification failed.");
        }

        ElectronicSignature esig = ElectronicSignature.builder()
                .user(currentUser)
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .meaning(request.getMeaning().name())
                .signedAt(OffsetDateTime.now())
                .build();

        ElectronicSignature savedEsig = repository.save(esig);

        // Audit Trail: Log the electronic signature event
        auditLogService.logEvent(
                currentUser,
                "SIGN",
                "ELECTRONIC_SIGNATURE",
                savedEsig.getId(),
                null,
                savedEsig.getMeaning()
        );

        return savedEsig;
    }
}
