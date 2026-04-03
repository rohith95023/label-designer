package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.LabelStock;
import com.pharmalabel.api.models.User;
import com.pharmalabel.api.repositories.LabelRepository;
import com.pharmalabel.api.repositories.LabelStockRepository;
import com.pharmalabel.api.services.AuditLogService;
import com.pharmalabel.api.services.LabelStockService;
import com.pharmalabel.api.services.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LabelStockServiceImpl implements LabelStockService {

    private final LabelStockRepository labelStockRepository;
    private final LabelRepository labelRepository;
    private final AuditLogService auditLogService;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    private static final List<String> ALLOWED_UOMS = Arrays.asList("ROLL", "SHEET", "PKT", "BOX", "CASE");
    private static final String STOCK_ID_REGEX = "^[a-zA-Z0-9\\-]+$";

    @Override
    public List<LabelStock> getAllLabelStocks() {
        return labelStockRepository.findAll();
    }

    @Override
    public Optional<LabelStock> getLabelStockById(UUID id) {
        return labelStockRepository.findById(id);
    }

    @Override
    @Transactional
    public LabelStock createLabelStock(LabelStock labelStock) {
        validate(labelStock, null);
        LabelStock saved = labelStockRepository.save(labelStock);
        
        auditLogService.logEvent(
            userService.getCurrentUser(),
            "CREATE",
            "LABEL_STOCK",
            saved.getId(),
            null,
            saved
        );
        
        return saved;
    }

    @Override
    @Transactional
    public LabelStock updateLabelStock(UUID id, LabelStock labelStock) {
        return labelStockRepository.findById(id)
                .map(existing -> {
                    // Check if in use by active printing jobs (proxied by Label association)
                    if (labelRepository.existsByLabelStockId(id)) {
                        throw new RuntimeException("Cannot modify label stock that is currently in use by active labels.");
                    }

                    validate(labelStock, id);
                    
                    Object oldSnapshot = existing; // Hibernate dirty checking might affect this, but for simple POJO it's okay if not detached
                    // Actually, to be safe for auditing, we should clone or map to a DTO/Map
                    Object oldData = objectMapper.convertValue(existing, Object.class);

                    existing.setName(labelStock.getName());
                    existing.setStockId(labelStock.getStockId());
                    existing.setDescription(labelStock.getDescription());
                    existing.setQuantityOnHand(labelStock.getQuantityOnHand());
                    existing.setReorderLevel(labelStock.getReorderLevel());
                    existing.setMaxStockLevel(labelStock.getMaxStockLevel());
                    existing.setUnitOfMeasure(labelStock.getUnitOfMeasure());
                    existing.setLength(labelStock.getLength());
                    existing.setBreadth(labelStock.getBreadth());
                    existing.setHeight(labelStock.getHeight());
                    existing.setStatus(labelStock.getStatus());
                    existing.setSupplier(labelStock.getSupplier());
                    existing.setCostCenter(labelStock.getCostCenter());
                    
                    LabelStock saved = labelStockRepository.save(existing);
                    
                    auditLogService.logEvent(
                        userService.getCurrentUser(),
                        "UPDATE",
                        "LABEL_STOCK",
                        saved.getId(),
                        oldData,
                        saved
                    );
                    
                    return saved;
                }).orElseThrow(() -> new RuntimeException("Label Stock not found with id: " + id));
    }

    @Override
    @Transactional
    public void deleteLabelStock(UUID id) {
        if (labelRepository.existsByLabelStockId(id)) {
            throw new RuntimeException("Cannot delete label stock that has associated labels or transaction history.");
        }
        
        LabelStock existing = labelStockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Label Stock not found"));
        
        auditLogService.logEvent(
            userService.getCurrentUser(),
            "DELETE",
            "LABEL_STOCK",
            id,
            existing,
            null
        );
        
        labelStockRepository.deleteById(id);
    }

    private void validate(LabelStock stock, UUID existingId) {
        // AC1: Unique name
        if (existingId == null) {
            if (labelStockRepository.existsByName(stock.getName())) {
                throw new RuntimeException("Label stock name must be unique within the organization.");
            }
        } else {
            if (labelStockRepository.existsByNameAndIdNot(stock.getName(), existingId)) {
                throw new RuntimeException("Label stock name must be unique within the organization.");
            }
        }

        // AC2: Unique code + format
        if (stock.getStockId() == null || !stock.getStockId().matches(STOCK_ID_REGEX)) {
            throw new RuntimeException("Label stock code follows defined format (alphanumeric and hyphens only).");
        }
        
        if (existingId == null) {
            if (labelStockRepository.existsByStockId(stock.getStockId())) {
                throw new RuntimeException("Label stock code must be unique across all label stocks.");
            }
        } else {
            if (labelStockRepository.existsByStockIdAndIdNot(stock.getStockId(), existingId)) {
                throw new RuntimeException("Label stock code must be unique across all label stocks.");
            }
        }

        // AC3: Quantity on hand >= 0
        if (stock.getQuantityOnHand() == null || stock.getQuantityOnHand().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Quantity on hand cannot be negative.");
        }

        // AC4: Reorder level non-negative and <= max stock
        if (stock.getReorderLevel() == null || stock.getReorderLevel().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Reorder level must be a non-negative number.");
        }
        if (stock.getMaxStockLevel() != null && stock.getReorderLevel().compareTo(stock.getMaxStockLevel()) > 0) {
            throw new RuntimeException("Reorder level cannot exceed the maximum stock level.");
        }

        // AC5: Unit of measure predefined and not blank
        if (stock.getUnitOfMeasure() == null || stock.getUnitOfMeasure().trim().isEmpty()) {
            throw new RuntimeException("Unit of measure cannot be left blank for active label stocks.");
        }
        if (!ALLOWED_UOMS.contains(stock.getUnitOfMeasure().toUpperCase())) {
            throw new RuntimeException("Unit of measure must be selected from the predefined list.");
        }

        // AC2: Status must be provided
        if (stock.getStatus() == null) {
            throw new RuntimeException("Label stock status is required.");
        }
    }
}

