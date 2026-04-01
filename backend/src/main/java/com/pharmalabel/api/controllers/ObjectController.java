package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.ObjectEntity;
import com.pharmalabel.api.services.ObjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/objects")
@RequiredArgsConstructor
public class ObjectController {

    private final ObjectService objectService;

    @GetMapping
    public ResponseEntity<List<ObjectEntity>> getAllObjects() {
        return ResponseEntity.ok(objectService.getAllObjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ObjectEntity> getObjectById(@PathVariable UUID id) {
        return objectService.getObjectById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/upload")
    public ResponseEntity<ObjectEntity> uploadObject(
            @RequestParam("name") String name,
            @RequestParam("type") String type,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(objectService.createObject(name, type, file));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ObjectEntity> updateObject(@PathVariable UUID id, @RequestBody ObjectEntity objectEntity) {
        return ResponseEntity.ok(objectService.updateObject(id, objectEntity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteObject(@PathVariable UUID id) {
        objectService.deleteObject(id);
        return ResponseEntity.noContent().build();
    }
}
