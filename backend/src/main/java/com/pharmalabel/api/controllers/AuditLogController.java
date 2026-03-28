package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.AuditLog;
import com.pharmalabel.api.repositories.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<Page<AuditLog>> getAllLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(
            auditLogRepository.findAllByOrderByTimestampDesc(PageRequest.of(page, size))
        );
    }

    @GetMapping("/module/{module}")
    public ResponseEntity<Page<AuditLog>> getLogsByModule(
            @PathVariable String module,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(
            auditLogRepository.findByModuleOrderByTimestampDesc(module, PageRequest.of(page, size))
        );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<AuditLog>> getLogsByUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(
            auditLogRepository.findByUserIdOrderByTimestampDesc(userId, PageRequest.of(page, size))
        );
    }

    @GetMapping("/date-range")
    public ResponseEntity<Page<AuditLog>> getLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(
            auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(start, end, PageRequest.of(page, size))
        );
    }
}
