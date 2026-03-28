package com.pharmalabel.api.services;

import com.pharmalabel.api.models.SavedTemplate;
import java.util.List;
import java.util.UUID;

public interface SavedTemplateService {
    List<SavedTemplate> getUserTemplates(String userId);
    SavedTemplate getTemplateById(UUID id);
    SavedTemplate createTemplate(SavedTemplate template);
    SavedTemplate updateTemplate(UUID id, SavedTemplate template);
    void deleteTemplate(UUID id);
    List<com.pharmalabel.api.models.TemplateVersion> getHistory(UUID templateId);
    SavedTemplate completeTemplate(UUID id);
    SavedTemplate approveTemplate(UUID id);
}
