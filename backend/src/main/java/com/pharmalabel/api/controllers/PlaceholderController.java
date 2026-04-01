package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.Placeholder;
import com.pharmalabel.api.services.PlaceholderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/placeholders")
@RequiredArgsConstructor
public class PlaceholderController {

    private final PlaceholderService placeholderService;

    @GetMapping
    public ResponseEntity<List<Placeholder>> getAllPlaceholders() {
        return ResponseEntity.ok(placeholderService.getAllPlaceholders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Placeholder> getPlaceholderById(@PathVariable UUID id) {
        return placeholderService.getPlaceholderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Placeholder> createPlaceholder(@RequestBody Placeholder placeholder) {
        return ResponseEntity.ok(placeholderService.createPlaceholder(placeholder));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Placeholder> updatePlaceholder(@PathVariable UUID id, @RequestBody Placeholder placeholder) {
        return ResponseEntity.ok(placeholderService.updatePlaceholder(id, placeholder));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlaceholder(@PathVariable UUID id) {
        placeholderService.deletePlaceholder(id);
        return ResponseEntity.noContent().build();
    }
}
