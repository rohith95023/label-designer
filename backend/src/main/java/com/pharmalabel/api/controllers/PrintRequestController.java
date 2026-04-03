package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.PrintRequest;
import com.pharmalabel.api.services.PrintRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/print-requests")
@RequiredArgsConstructor
public class PrintRequestController {

    private final PrintRequestService printRequestService;

    @GetMapping
    public ResponseEntity<List<PrintRequest>> getAll() {
        return ResponseEntity.ok(printRequestService.getAllPrintRequests());
    }

    @GetMapping("/my")
    public ResponseEntity<List<PrintRequest>> getMy() {
        return ResponseEntity.ok(printRequestService.getMyPrintRequests());
    }

    @PostMapping
    public ResponseEntity<PrintRequest> create(@RequestBody PrintRequest request) {
        return ResponseEntity.ok(printRequestService.createPrintRequest(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PrintRequest> updateStatus(@PathVariable UUID id, @RequestParam String status) {
        return ResponseEntity.ok(printRequestService.updatePrintRequestStatus(id, status));
    }
}
