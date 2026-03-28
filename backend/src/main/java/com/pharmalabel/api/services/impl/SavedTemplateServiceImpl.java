package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.exceptions.ResourceNotFoundException;
import com.pharmalabel.api.models.SavedTemplate;
import com.pharmalabel.api.models.User;
import com.pharmalabel.api.models.TemplateVersion;
import com.pharmalabel.api.repositories.SavedTemplateRepository;
import com.pharmalabel.api.repositories.TemplateVersionRepository;
import com.pharmalabel.api.services.SavedTemplateService;
import com.pharmalabel.api.services.UserService;
import com.pharmalabel.api.services.SystemConfigService;
import com.pharmalabel.api.services.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SavedTemplateServiceImpl implements SavedTemplateService {

    private final SavedTemplateRepository repository;
    private final TemplateVersionRepository versionRepository;
    private final UserService userService;
    private final SystemConfigService systemConfigService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<SavedTemplate> getUserTemplates(String userId) {
        User currentUser = null;
        try {
            currentUser = userService.getCurrentUser();
        } catch (Exception e) {
            // Probably anonymous/guest accessing editor
        }

        // Admin override: Admins see everything in the system
        if (currentUser != null && currentUser.getRole() != null && 
            currentUser.getRole().getName().equalsIgnoreCase("ADMIN")) {
            return repository.findAllByOrderByUpdatedAtDesc();
        }

        // Search by both guest string ID and authenticated owner UUID
        try {
            UUID userUuid = UUID.fromString(userId);
            return repository.findByUserIdOrOwner_IdOrderByUpdatedAtDesc(userId, userUuid);
        } catch (IllegalArgumentException e) {
            // Not a UUID (anonymous session id), search by string only
            return repository.findByUserIdOrderByUpdatedAtDesc(userId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public SavedTemplate getTemplateById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SavedTemplate " + id));
    }

    @Override
    @Transactional
    public SavedTemplate createTemplate(SavedTemplate template) {
        // Set owner if not set
        if (template.getOwner() == null) {
            template.setOwner(userService.getCurrentUser());
        }
        SavedTemplate saved = repository.save(template);

        // Audit: Log template creation
        auditLogService.logEvent(
            template.getOwner(),
            "CREATE",
            "TEMPLATES",
            "TEMPLATE_CREATED",
            null,
            saved.getId().toString()
        );

        return saved;
    }

    @Override
    @Transactional
    public SavedTemplate updateTemplate(UUID id, SavedTemplate templateData) {
        SavedTemplate existing = getTemplateById(id);
        
        // Reset workflow if content changed (SoD reset)
        if (templateData.getElementsData() != null && !templateData.getElementsData().equals(existing.getElementsData())) {
            existing.setCompletedBy(null);
            existing.setApprovedBy(null);
        }

        existing.setName(templateData.getName());
        existing.setLabelSize(templateData.getLabelSize());
        existing.setBgColor(templateData.getBgColor());
        existing.setElementsData(templateData.getElementsData());
        existing.setUpdatedAt(OffsetDateTime.now());

        SavedTemplate saved = repository.save(existing);

        // Audit: Log template update
        auditLogService.logEvent(
            userService.getCurrentUser(),
            "UPDATE",
            "TEMPLATES",
            "TEMPLATE_UPDATED",
            null,
            saved.getId().toString()
        );

        // Save version
        int nextVersion = versionRepository.findMaxVersionNumberUser(saved.getId()) + 1;
        TemplateVersion version = TemplateVersion.builder()
                .savedTemplate(saved)
                .versionNumber(nextVersion)
                .elementsData(saved.getElementsData())
                .build();
        versionRepository.save(version);

        return saved;
    }

    @Override
    @Transactional
    public SavedTemplate completeTemplate(UUID id) {
        SavedTemplate template = getTemplateById(id);
        User currentUser = userService.getCurrentUser();
        template.setCompletedBy(currentUser);
        
        SavedTemplate saved = repository.save(template);
        
        auditLogService.logEvent(
            currentUser, 
            "COMPLETE", 
            "TEMPLATES", 
            "TEMPLATE_COMPLETED", 
            null, 
            saved.getId().toString()
        );
        
        return saved;
    }

    @Override
    @Transactional
    public SavedTemplate approveTemplate(UUID id) {
        SavedTemplate template = getTemplateById(id);
        User currentUser = userService.getCurrentUser();

        // GxP Requirement: Backend Segregation of Duties (SoD) enforcement based on configuration
        boolean preventSameUser = systemConfigService.getBooleanConfig("sod.prevent_same_user_approve", true);
        
        if (preventSameUser && template.getCompletedBy() != null && template.getCompletedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Segregation of Duties Violation: You cannot approve a label you marked as complete.");
        }

        template.setApprovedBy(currentUser);
        SavedTemplate saved = repository.save(template);
        
        auditLogService.logEvent(
            currentUser, 
            "APPROVE", 
            "TEMPLATES", 
            "TEMPLATE_APPROVED", 
            null, 
            saved.getId().toString()
        );
        
        return saved;
    }

    @Override
    @Transactional
    public void deleteTemplate(UUID id) {
        SavedTemplate existing = getTemplateById(id);
        User currentUser = userService.getCurrentUser();
        String templateId = existing.getId().toString();
        repository.delete(existing);

        // Audit: Log template deletion
        auditLogService.logEvent(
            currentUser,
            "DELETE",
            "TEMPLATES",
            "TEMPLATE_DELETED",
            null,
            templateId
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<TemplateVersion> getHistory(UUID templateId) {
        return versionRepository.findBySavedTemplateIdOrderByVersionNumberDesc(templateId);
    }
}
