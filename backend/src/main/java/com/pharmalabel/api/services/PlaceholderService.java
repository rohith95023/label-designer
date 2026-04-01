package com.pharmalabel.api.services;

import com.pharmalabel.api.models.Placeholder;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlaceholderService {
    List<Placeholder> getAllPlaceholders();
    Optional<Placeholder> getPlaceholderById(UUID id);
    Placeholder createPlaceholder(Placeholder placeholder);
    Placeholder updatePlaceholder(UUID id, Placeholder placeholder);
    void deletePlaceholder(UUID id);
}
