package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.exceptions.ResourceNotFoundException;
import com.pharmalabel.api.models.SavedTemplate;
import com.pharmalabel.api.repositories.SavedTemplateRepository;
import com.pharmalabel.api.services.SavedTemplateService;
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
    private final com.pharmalabel.api.repositories.TemplateVersionRepository versionRepository;
    private final com.pharmalabel.api.services.UserService userService;

    @Override
    @Transactional(readOnly = true)
    public List<SavedTemplate> getUserTemplates(String userId) {
        // Migration: If we find a user by this guest ID (userId is the string guest id), we should also return their files
        // But for now, just keep the standard legacy behavior if it exists.
        return repository.findByUserIdOrderByUpdatedAtDesc(userId);
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
        return repository.save(template);
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
        
        // Save version
        int nextVersion = versionRepository.findMaxVersionNumberUser(saved.getId()) + 1;
        com.pharmalabel.api.models.TemplateVersion version = com.pharmalabel.api.models.TemplateVersion.builder()
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
        template.setCompletedBy(userService.getCurrentUser());
        return repository.save(template);
    }

    @Override
    @Transactional
    public SavedTemplate approveTemplate(UUID id) {
        SavedTemplate template = getTemplateById(id);
        com.pharmalabel.api.models.User currentUser = userService.getCurrentUser();

        // GxP Requirement: Backend Segregation of Duties (SoD) enforcement
        if (template.getCompletedBy() != null && template.getCompletedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Segregation of Duties Violation: You cannot approve a label you marked as complete.");
        }

        template.setApprovedBy(currentUser);
        return repository.save(template);
    }

    @Override
    @Transactional
    public void deleteTemplate(UUID id) {
        SavedTemplate existing = getTemplateById(id);
        repository.delete(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.pharmalabel.api.models.TemplateVersion> getHistory(UUID templateId) {
        return versionRepository.findBySavedTemplateIdOrderByVersionNumberDesc(templateId);
    }
}
