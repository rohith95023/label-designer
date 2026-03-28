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

    @Override
    @Transactional(readOnly = true)
    public List<SavedTemplate> getUserTemplates(String userId) {
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
        return repository.save(template);
    }

    @Override
    @Transactional
    public SavedTemplate updateTemplate(UUID id, SavedTemplate templateData) {
        SavedTemplate existing = getTemplateById(id);
        
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
