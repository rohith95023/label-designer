package com.pharmalabel.api.controllers;

import com.pharmalabel.api.dtos.label.CreateLabelRequest;
import com.pharmalabel.api.dtos.label.LabelDto;
import com.pharmalabel.api.dtos.label.LabelVersionDto;
import com.pharmalabel.api.dtos.label.SaveVersionRequest;
import com.pharmalabel.api.models.Label;
import com.pharmalabel.api.models.LabelStock;
import com.pharmalabel.api.models.LabelVersion;
import com.pharmalabel.api.models.User;
import com.pharmalabel.api.repositories.LabelStockRepository;
import com.pharmalabel.api.services.LabelService;
import com.pharmalabel.api.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/labels")
@RequiredArgsConstructor
public class LabelController {

    private final LabelService labelService;
    private final UserService userService;
    private final LabelStockRepository labelStockRepository;

    @GetMapping
    public ResponseEntity<List<LabelDto>> getLabels(@RequestParam(required = false) String status) {
        List<Label> labels = (status != null) ? labelService.getLabelsByStatus(status) : labelService.getLabelsByStatus("ACTIVE");
        return ResponseEntity.ok(labels.stream().map(this::mapToDto).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LabelDto> getLabel(@PathVariable UUID id) {
        return labelService.getLabel(id)
                .map(this::mapToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LabelDto> createLabel(@Valid @RequestBody CreateLabelRequest request) {
        User currentUser = userService.getCurrentUser();
        LabelStock stock = labelStockRepository.findById(request.getLabelStockId())
                .orElseThrow(() -> new RuntimeException("Label stock not found"));

        Label label = Label.builder()
                .name(request.getName())
                .labelStock(stock)
                .notes(request.getNotes())
                .status(request.getStatus())
                .build();

        Label saved = labelService.createLabel(label, request.getDesignJson(), currentUser);
        return ResponseEntity.ok(mapToDto(saved));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<LabelVersionDto>> getVersionHistory(@PathVariable UUID id) {
        List<LabelVersion> history = labelService.getVersionHistory(id);
        return ResponseEntity.ok(history.stream().map(this::mapVersionToDto).collect(Collectors.toList()));
    }

    @GetMapping("/{id}/versions/{versionNo}")
    public ResponseEntity<LabelVersionDto> getVersion(@PathVariable UUID id, @PathVariable Integer versionNo) {
        return labelService.getVersion(id, versionNo)
                .map(this::mapVersionToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/versions/latest")
    public ResponseEntity<LabelVersionDto> getLatestVersion(@PathVariable UUID id) {
        return labelService.getLatestVersion(id)
                .map(this::mapVersionToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/versions")
    public ResponseEntity<LabelVersionDto> saveNewVersion(@PathVariable UUID id, @RequestBody SaveVersionRequest request) {
        User currentUser = userService.getCurrentUser();
        LabelVersion version = labelService.saveNewVersion(id, request.getDesignJson(), request.getNotes(), request.getLabelStockId(), currentUser);
        return ResponseEntity.ok(mapVersionToDto(version));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLabel(@PathVariable UUID id) {
        labelService.deleteLabel(id);
        return ResponseEntity.noContent().build();
    }

    private LabelDto mapToDto(Label label) {
        LabelDto dto = new LabelDto();
        dto.setId(label.getId());
        dto.setName(label.getName());
        dto.setBrand(label.getBrand());
        dto.setCategory(label.getCategory());
        dto.setStatus(label.getStatus());
        dto.setImageUrl(label.getImageUrl());
        dto.setNotes(label.getNotes());
        dto.setLabelStockId(label.getLabelStock() != null ? label.getLabelStock().getId() : null);
        dto.setLabelStockName(label.getLabelStock() != null ? label.getLabelStock().getStockId() : null);
        dto.setCreatedById(label.getCreatedBy() != null ? label.getCreatedBy().getId() : null);
        dto.setCreatedByUsername(label.getCreatedBy() != null ? label.getCreatedBy().getUsername() : null);
        dto.setCreatedAt(label.getCreatedAt());
        dto.setUpdatedAt(label.getUpdatedAt());
        
        labelService.getLatestVersion(label.getId()).ifPresent(v -> {
            dto.setLatestVersionNo(v.getVersionNo());
            dto.setLatestVersionDesign(v.getDesignJson());
        });
        
        return dto;
    }

    private LabelVersionDto mapVersionToDto(LabelVersion version) {
        LabelVersionDto dto = new LabelVersionDto();
        dto.setId(version.getId());
        dto.setLabelId(version.getLabel().getId());
        dto.setVersionNo(version.getVersionNo());
        dto.setDesignJson(version.getDesignJson());
        dto.setCreatedById(version.getCreatedBy() != null ? version.getCreatedBy().getId() : null);
        dto.setCreatedByUsername(version.getCreatedBy() != null ? version.getCreatedBy().getUsername() : null);
        dto.setCreatedAt(version.getCreatedAt());
        return dto;
    }
}
