package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.Placeholder;
import com.pharmalabel.api.repositories.PlaceholderRepository;
import com.pharmalabel.api.services.PlaceholderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlaceholderServiceImpl implements PlaceholderService {

    private final PlaceholderRepository placeholderRepository;

    @Override
    public List<Placeholder> getAllPlaceholders() {
        return placeholderRepository.findAll();
    }

    @Override
    public Optional<Placeholder> getPlaceholderById(UUID id) {
        return placeholderRepository.findById(id);
    }

    @Override
    @Transactional
    public Placeholder createPlaceholder(Placeholder placeholder) {
        return placeholderRepository.save(placeholder);
    }

    @Override
    @Transactional
    public Placeholder updatePlaceholder(UUID id, Placeholder placeholder) {
        return placeholderRepository.findById(id)
                .map(existing -> {
                    existing.setName(placeholder.getName());
                    existing.setMappingKey(placeholder.getMappingKey());
                    existing.setType(placeholder.getType());
                    existing.setDefaultValue(placeholder.getDefaultValue());
                    existing.setDescription(placeholder.getDescription());
                    existing.setStatus(placeholder.getStatus());
                    existing.setFormatRules(placeholder.getFormatRules());
                    return placeholderRepository.save(existing);
                }).orElseThrow(() -> new RuntimeException("Placeholder not found with id: " + id));
    }

    @Override
    @Transactional
    public void deletePlaceholder(UUID id) {
        placeholderRepository.deleteById(id);
    }
}
