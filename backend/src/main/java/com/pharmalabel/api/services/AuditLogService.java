package com.pharmalabel.api.services;

import com.pharmalabel.api.models.AuditLog;
import com.pharmalabel.api.models.User;
import com.pharmalabel.api.repositories.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void logEvent(User user, String action, String module, java.util.UUID entityId, Object oldData, Object newData) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .module(module)
                .entityId(entityId)
                .oldData(oldData)
                .newData(newData)
                .build();
        auditLogRepository.save(log);
    }
}
