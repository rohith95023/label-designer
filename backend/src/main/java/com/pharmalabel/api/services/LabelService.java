package com.pharmalabel.api.services;

import com.pharmalabel.api.models.Label;
import com.pharmalabel.api.models.LabelVersion;
import com.pharmalabel.api.models.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LabelService {
    Label createLabel(Label label, Object designJson, User user);
    Label updateLabel(Label label);
    LabelVersion saveNewVersion(UUID labelId, Object designJson, String notes, User user);
    
    Optional<Label> getLabel(UUID id);
    List<Label> getLabelsByStatus(String status);
    
    Optional<LabelVersion> getLatestVersion(UUID labelId);
    Optional<LabelVersion> getVersion(UUID labelId, Integer versionNo);
    List<LabelVersion> getVersionHistory(UUID labelId);

    void deleteLabel(UUID id);
}
