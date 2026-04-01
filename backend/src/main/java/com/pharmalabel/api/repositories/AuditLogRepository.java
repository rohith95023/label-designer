package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.OffsetDateTime;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<AuditLog> findByModuleOrderByCreatedAtDesc(String module, Pageable pageable);
    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    Page<AuditLog> findByEntityIdOrderByCreatedAtDesc(UUID entityId, Pageable pageable);
    Page<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    Page<AuditLog> findByModuleAndCreatedAtBetweenOrderByCreatedAtDesc(String module, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
}
