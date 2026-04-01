package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.Phrase;
import com.pharmalabel.api.services.PhraseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/phrases")
@RequiredArgsConstructor
public class PhraseController {

    private final PhraseService phraseService;

    @GetMapping
    public ResponseEntity<List<Phrase>> getAllPhrases() {
        return ResponseEntity.ok(phraseService.getAllPhrases());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Phrase> getPhraseById(@PathVariable UUID id) {
        return phraseService.getPhraseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Phrase> createPhrase(@RequestBody Phrase phrase) {
        return ResponseEntity.ok(phraseService.createPhrase(phrase));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Phrase> updatePhrase(@PathVariable UUID id, @RequestBody Phrase phrase) {
        return ResponseEntity.ok(phraseService.updatePhrase(id, phrase));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePhrase(@PathVariable UUID id) {
        phraseService.deletePhrase(id);
        return ResponseEntity.noContent().build();
    }
}
