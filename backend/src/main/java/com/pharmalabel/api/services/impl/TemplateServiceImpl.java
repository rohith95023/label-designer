package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.exceptions.ResourceNotFoundException;
import com.pharmalabel.api.models.Template;
import com.pharmalabel.api.repositories.TemplateRepository;
import com.pharmalabel.api.services.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TemplateServiceImpl implements TemplateService {

    private final TemplateRepository templateRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Template> getAllTemplates() {
        return templateRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Template getTemplateById(UUID id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template " + id));
    }

    @Override
    @Transactional
    public Template createTemplate(Template template) {
        return templateRepository.save(template);
    }

    @Override
    @Transactional
    public Template updateTemplate(UUID id, Template templateData) {
        Template existingTemplate = getTemplateById(id);
        
        existingTemplate.setName(templateData.getName());
        existingTemplate.setBrand(templateData.getBrand());
        existingTemplate.setCategory(templateData.getCategory());
        existingTemplate.setSize(templateData.getSize());
        existingTemplate.setImageUrl(templateData.getImageUrl());
        existingTemplate.setElementsData(templateData.getElementsData());

        return templateRepository.save(existingTemplate);
    }

    @Override
    @Transactional
    public void deleteTemplate(UUID id) {
        Template existingTemplate = getTemplateById(id);
        templateRepository.delete(existingTemplate);
    }
}
