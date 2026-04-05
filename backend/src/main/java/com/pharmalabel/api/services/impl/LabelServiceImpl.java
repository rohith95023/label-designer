package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.Label;
import com.pharmalabel.api.models.LabelVersion;
import com.pharmalabel.api.models.User;
import com.pharmalabel.api.repositories.LabelRepository;
import com.pharmalabel.api.repositories.LabelStockRepository;
import com.pharmalabel.api.repositories.LabelVersionRepository;
import com.pharmalabel.api.services.LabelService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LabelServiceImpl implements LabelService {

    private final LabelRepository labelRepository;
    private final LabelVersionRepository labelVersionRepository;
    private final LabelStockRepository labelStockRepository;

    @Override
    @Transactional
    public Label createLabel(Label label, Object designJson, User user) {
        label.setCreatedBy(user);
        Label savedLabel = labelRepository.save(label);

        // Create initial version
        LabelVersion initialVersion = LabelVersion.builder()
                .label(savedLabel)
                .versionNo(1)
                .designJson(designJson)
                .createdBy(user)
                .build();
        labelVersionRepository.save(initialVersion);

        return savedLabel;
    }

    @Override
    @Transactional
    public Label updateLabel(Label label) {
        return labelRepository.save(label);
    }

    @Override
    @Transactional
    public synchronized LabelVersion updateLatestVersion(UUID labelId, Object designJson, String notes, UUID labelStockId, User user) {
        LabelVersion latest = labelVersionRepository.findFirstByLabelIdOrderByVersionNoDesc(labelId)
                .orElseThrow(() -> new RuntimeException("No version found to update for label id: " + labelId));

        latest.setDesignJson(designJson);
        // Optionally update other details if needed for auto-save
        
        Label label = latest.getLabel();
        if (notes != null) {
            label.setNotes(notes);
            labelRepository.save(label);
        }

        return labelVersionRepository.save(latest);
    }

    @Override
    @Transactional
    public synchronized LabelVersion saveNewVersion(UUID labelId, Object designJson, String notes, UUID labelStockId, User user) {
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new RuntimeException("Label not found with id: " + labelId));

        boolean labelUpdated = false;

        if (notes != null) {
            label.setNotes(notes);
            labelUpdated = true;
        }

        if (labelStockId != null && (label.getLabelStock() == null || !label.getLabelStock().getId().equals(labelStockId))) {
            labelStockRepository.findById(labelStockId).ifPresent(label::setLabelStock);
            labelUpdated = true;
        }

        if (labelUpdated) {
            labelRepository.save(label);
        }

        Integer nextVersionNo = labelVersionRepository.findFirstByLabelIdOrderByVersionNoDesc(labelId)
                .map(v -> v.getVersionNo() + 1)
                .orElse(1);

        LabelVersion newVersion = LabelVersion.builder()
                .label(label)
                .versionNo(nextVersionNo)
                .designJson(designJson)
                .createdBy(user)
                .build();

        return labelVersionRepository.save(newVersion);
    }

    @Override
    public Optional<Label> getLabel(UUID id) {
        return labelRepository.findById(id);
    }

    @Override
    public List<Label> getLabelsByStatus(String status) {
        return labelRepository.findByStatus(status);
    }

    @Override
    public Optional<LabelVersion> getLatestVersion(UUID labelId) {
        return labelVersionRepository.findFirstByLabelIdOrderByVersionNoDesc(labelId);
    }

    @Override
    public Optional<LabelVersion> getVersion(UUID labelId, Integer versionNo) {
        return labelVersionRepository.findByLabelIdAndVersionNo(labelId, versionNo);
    }

    @Override
    public List<LabelVersion> getVersionHistory(UUID labelId) {
        return labelVersionRepository.findByLabelIdOrderByVersionNoDesc(labelId);
    }

    @Override
    @Transactional
    public void deleteLabel(UUID id) {
        labelRepository.deleteById(id);
    }
}
