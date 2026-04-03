package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.*;
import com.pharmalabel.api.models.enums.PrintRequestStatus;
import com.pharmalabel.api.repositories.LabelRepository;
import com.pharmalabel.api.repositories.LabelStockRepository;
import com.pharmalabel.api.repositories.LabelVersionRepository;
import com.pharmalabel.api.repositories.PrintRequestRepository;
import com.pharmalabel.api.services.AuditLogService;
import com.pharmalabel.api.services.PrintRequestService;
import com.pharmalabel.api.services.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PrintRequestServiceImpl implements PrintRequestService {

    private final PrintRequestRepository printRequestRepository;
    private final LabelRepository labelRepository;
    private final LabelStockRepository labelStockRepository;
    private final LabelVersionRepository labelVersionRepository;
    private final AuditLogService auditLogService;
    private final UserService userService;

    public PrintRequestServiceImpl(
            PrintRequestRepository printRequestRepository,
            LabelRepository labelRepository,
            LabelStockRepository labelStockRepository,
            LabelVersionRepository labelVersionRepository,
            AuditLogService auditLogService,
            UserService userService) {
        this.printRequestRepository = printRequestRepository;
        this.labelRepository = labelRepository;
        this.labelStockRepository = labelStockRepository;
        this.labelVersionRepository = labelVersionRepository;
        this.auditLogService = auditLogService;
        this.userService = userService;
    }

    private static final double PX_PER_MM = 3.7795;

    @Override
    public List<PrintRequest> getAllPrintRequests() {
        return printRequestRepository.findAll();
    }

    @Override
    public List<PrintRequest> getMyPrintRequests() {
        User current = userService.getCurrentUser();
        return printRequestRepository.findByRequestedByIdOrderByRequestedAtDesc(current.getId());
    }

    @Override
    public Optional<PrintRequest> getPrintRequestById(UUID id) {
        return printRequestRepository.findById(id);
    }

    @Override
    @Transactional
    public PrintRequest createPrintRequest(PrintRequest printRequest) {
        User current = userService.getCurrentUser();
        printRequest.setRequestedBy(current);
        printRequest.setStatus(PrintRequestStatus.PENDING);

        // Validation: Required objects
        if (printRequest.getLabel() == null || printRequest.getLabel().getId() == null) {
            throw new RuntimeException("Target Label design is required.");
        }
        if (printRequest.getLabelStock() == null || printRequest.getLabelStock().getId() == null) {
            throw new RuntimeException("Physical Label Stock is required.");
        }

        // Validation: Required fields
        if (printRequest.getQuantity() == null || printRequest.getQuantity() <= 0) {
            throw new RuntimeException("Quantity must be greater than zero.");
        }
        if (printRequest.getPrinterName() == null || printRequest.getPrinterName().trim().isEmpty()) {
            throw new RuntimeException("Printer name is required.");
        }

        // Fetch Label and Stock
        Label label = labelRepository.findById(printRequest.getLabel().getId())
                .orElseThrow(() -> new RuntimeException("Label not found"));
        LabelStock stock = labelStockRepository.findById(printRequest.getLabelStock().getId())
                .orElseThrow(() -> new RuntimeException("Label Stock not found"));

        if (stock.getStatus() != null && !"ACTIVE".equals(stock.getStatus().name())) {
            throw new RuntimeException("Selected label stock is not active.");
        }

        // AC7: Compatibility Validation (Dimensions)
        validateCompatibility(label, stock);

        printRequest.setLabel(label);
        printRequest.setLabelStock(stock);

        PrintRequest saved = printRequestRepository.save(printRequest);

        auditLogService.logEvent(
                current,
                "CREATE",
                "PRINT_REQUEST",
                saved.getId(),
                null,
                saved
        );

        return saved;
    }

    @Override
    @Transactional
    public PrintRequest updatePrintRequestStatus(UUID id, String status) {
        PrintRequest existing = printRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Print request not found"));

        PrintRequestStatus oldStatus = existing.getStatus();
        PrintRequestStatus newStatus = PrintRequestStatus.valueOf(status.toUpperCase());
        
        existing.setStatus(newStatus);
        PrintRequest saved = printRequestRepository.save(existing);

        auditLogService.logEvent(
                userService.getCurrentUser(),
                "UPDATE_STATUS",
                "PRINT_REQUEST",
                id,
                Map.of("previousStatus", oldStatus),
                Map.of("newStatus", newStatus)
        );

        return saved;
    }

    private void validateCompatibility(Label label, LabelStock stock) {
        LabelVersion latest = labelVersionRepository.findFirstByLabelIdOrderByVersionNoDesc(label.getId())
                .orElseThrow(() -> new RuntimeException("No approved design version found for this label."));

        Object designObj = latest.getDesignJson();
        if (designObj instanceof Map) {
            Map<?, ?> design = (Map<?, ?>) designObj;
            Object sizeObj = design.get("labelSize");
            if (sizeObj instanceof Map) {
                Map<?, ?> size = (Map<?, ?>) sizeObj;
                Object w = size.get("w");
                Object h = size.get("h");
                
                if (w != null && h != null) {
                    try {
                        double labelW = Double.parseDouble(w.toString()) / PX_PER_MM;
                        double labelH = Double.parseDouble(h.toString()) / PX_PER_MM;

                        double stockW = stock.getBreadth().doubleValue();
                        double stockH = stock.getHeight().doubleValue();

                        if (labelW > stockW + 0.5 || labelH > stockH + 0.5) { // 0.5mm tolerance
                            throw new RuntimeException(String.format(
                                    "Incompatible Dimensions: Label design (%.1f x %.1f mm) is larger than stock (%.1f x %.1f mm).",
                                    labelW, labelH, stockW, stockH
                            ));
                        }
                    } catch (NumberFormatException e) {
                        // If size is not a valid number, log and skip compatibility check to avoid blocking print
                        System.err.println("Failed to parse label dimensions: " + e.getMessage());
                    }
                }
            }
        }
    }
}