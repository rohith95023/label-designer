package com.pharmalabel.api.services;

import com.pharmalabel.api.models.Template;

import java.util.List;
import java.util.UUID;

public interface TemplateService {
    List<Template> getAllTemplates();
    Template getTemplateById(UUID id);
    Template createTemplate(Template template);
    Template updateTemplate(UUID id, Template templateData);
    void deleteTemplate(UUID id);
}
