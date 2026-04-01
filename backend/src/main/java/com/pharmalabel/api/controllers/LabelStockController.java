package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.LabelStock;
import com.pharmalabel.api.services.LabelStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/label-stocks")
@RequiredArgsConstructor
public class LabelStockController {

    private final LabelStockService labelStockService;

    @GetMapping
    public ResponseEntity<List<LabelStock>> getAllLabelStocks() {
        return ResponseEntity.ok(labelStockService.getAllLabelStocks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LabelStock> getLabelStockById(@PathVariable UUID id) {
        return labelStockService.getLabelStockById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LabelStock> createLabelStock(@RequestBody LabelStock labelStock) {
        return ResponseEntity.ok(labelStockService.createLabelStock(labelStock));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LabelStock> updateLabelStock(@PathVariable UUID id, @RequestBody LabelStock labelStock) {
        return ResponseEntity.ok(labelStockService.updateLabelStock(id, labelStock));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLabelStock(@PathVariable UUID id) {
        labelStockService.deleteLabelStock(id);
        return ResponseEntity.noContent().build();
    }
}
