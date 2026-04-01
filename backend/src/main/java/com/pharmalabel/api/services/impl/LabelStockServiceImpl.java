package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.LabelStock;
import com.pharmalabel.api.repositories.LabelStockRepository;
import com.pharmalabel.api.services.LabelStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LabelStockServiceImpl implements LabelStockService {

    private final LabelStockRepository labelStockRepository;

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
        return labelStockRepository.save(labelStock);
    }

    @Override
    @Transactional
    public LabelStock updateLabelStock(UUID id, LabelStock labelStock) {
        return labelStockRepository.findById(id)
                .map(existing -> {
                    existing.setName(labelStock.getName());
                    existing.setLength(labelStock.getLength());
                    existing.setWidth(labelStock.getWidth());
                    existing.setHeight(labelStock.getHeight());
                    existing.setDescription(labelStock.getDescription());
                    return labelStockRepository.save(existing);
                }).orElseThrow(() -> new RuntimeException("Label Stock not found with id: " + id));
    }

    @Override
    @Transactional
    public void deleteLabelStock(UUID id) {
        labelStockRepository.deleteById(id);
    }
}
