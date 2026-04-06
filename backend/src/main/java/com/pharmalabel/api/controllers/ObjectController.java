package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.ObjectEntity;
import com.pharmalabel.api.models.enums.ObjectStatus;
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

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ObjectEntity>> getObjectsByStatus(@PathVariable ObjectStatus status) {
        return ResponseEntity.ok(objectService.getObjectsByStatus(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ObjectEntity> getObjectById(@PathVariable UUID id) {
        return objectService.getObjectById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<ObjectEntity>> getVersions(@PathVariable UUID id) {
        return objectService.getObjectById(id)
                .map(obj -> ResponseEntity.ok(objectService.getVersionsForObject(obj.getParentId())))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/upload")
    public ResponseEntity<ObjectEntity> uploadObject(
            @RequestParam("name") String name,
            @RequestParam("type") String type,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "labelId", required = false) String labelId) {
        
        UUID labelUuid = null;
        if (labelId != null && !labelId.isEmpty() && !"null".equalsIgnoreCase(labelId)) {
            try {
                labelUuid = UUID.fromString(labelId);
            } catch (Exception ignored) {}
        }
        
        return ResponseEntity.ok(objectService.createObject(name, type, description, tags, file, labelUuid));
    }

    @PostMapping(value = "/{id}/replace")
    public ResponseEntity<ObjectEntity> replaceObject(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(objectService.replaceObject(id, file));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<ObjectEntity> activateVersion(@PathVariable UUID id) {
        return ResponseEntity.ok(objectService.activateVersion(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ObjectEntity> updateMetadata(
            @PathVariable UUID id,
            @RequestParam("name") String name,
            @RequestParam("type") String type,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "tags", required = false) String tags) {
        return ResponseEntity.ok(objectService.updateMetadata(id, name, type, description, tags));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteObject(@PathVariable UUID id) {
        objectService.deleteObject(id);
        return ResponseEntity.noContent().build();
    }
}
