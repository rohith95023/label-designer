package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.Translation;
import com.pharmalabel.api.services.TranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/translations")
@RequiredArgsConstructor
public class TranslationController {

    private final TranslationService translationService;

    @GetMapping
    public ResponseEntity<List<Translation>> getAllTranslations() {
        return ResponseEntity.ok(translationService.getAllTranslations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Translation> getTranslationById(@PathVariable UUID id) {
        return translationService.getTranslationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/phrase/{phraseId}")
    public ResponseEntity<List<Translation>> getTranslationsByPhraseId(@PathVariable UUID phraseId) {
        return ResponseEntity.ok(translationService.getTranslationsByPhraseId(phraseId));
    }

    @GetMapping("/language/{languageId}")
    public ResponseEntity<List<Translation>> getTranslationsByLanguageId(@PathVariable UUID languageId) {
        return ResponseEntity.ok(translationService.getTranslationsByLanguageId(languageId));
    }

    @PostMapping
    public ResponseEntity<Translation> createTranslation(@RequestBody Translation translation) {
        return ResponseEntity.ok(translationService.createTranslation(translation));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Translation> updateTranslation(@PathVariable UUID id, @RequestBody Translation translation) {
        return ResponseEntity.ok(translationService.updateTranslation(id, translation));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTranslation(@PathVariable UUID id) {
        translationService.deleteTranslation(id);
        return ResponseEntity.noContent().build();
    }
}
