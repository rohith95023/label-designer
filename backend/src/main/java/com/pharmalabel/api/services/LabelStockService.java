package com.pharmalabel.api.services;

import com.pharmalabel.api.models.LabelStock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LabelStockService {
    List<LabelStock> getAllLabelStocks();
    Optional<LabelStock> getLabelStockById(UUID id);
    LabelStock createLabelStock(LabelStock labelStock);
    LabelStock updateLabelStock(UUID id, LabelStock labelStock);
    void deleteLabelStock(UUID id);
}
