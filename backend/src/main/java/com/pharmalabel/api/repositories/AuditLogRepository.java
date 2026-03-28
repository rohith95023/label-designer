package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.OffsetDateTime;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    Page<AuditLog> findByModuleOrderByTimestampDesc(String module, Pageable pageable);
    Page<AuditLog> findByUserIdOrderByTimestampDesc(UUID userId, Pageable pageable);
    Page<AuditLog> findByTimestampBetweenOrderByTimestampDesc(OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    Page<AuditLog> findByModuleAndTimestampBetweenOrderByTimestampDesc(String module, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
}
