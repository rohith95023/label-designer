package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.SavedTemplate;
import com.pharmalabel.api.services.SavedTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user-templates")
@RequiredArgsConstructor
public class SavedTemplateController {

    private final SavedTemplateService service;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SavedTemplate>> getUserTemplates(@PathVariable String userId) {
        return ResponseEntity.ok(service.getUserTemplates(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavedTemplate> getTemplateById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getTemplateById(id));
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<SavedTemplate> createTemplate(@PathVariable String userId, @RequestBody SavedTemplate template) {
        template.setUserId(userId);
        return new ResponseEntity<>(service.createTemplate(template), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedTemplate> updateTemplate(@PathVariable UUID id, @RequestBody SavedTemplate templateData) {
        return ResponseEntity.ok(service.updateTemplate(id, templateData));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID id) {
        service.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<com.pharmalabel.api.models.TemplateVersion>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getHistory(id));
    }
}
