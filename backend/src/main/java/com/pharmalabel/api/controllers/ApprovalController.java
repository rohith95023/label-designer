package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.Approval;
import com.pharmalabel.api.models.User;
import com.pharmalabel.api.services.ApprovalService;
import com.pharmalabel.api.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Approval>> getAllApprovals() {
        return ResponseEntity.ok(approvalService.getAllApprovals());
    }

    @GetMapping("/label/{labelId}")
    public ResponseEntity<List<Approval>> getApprovalsByLabelId(@PathVariable UUID labelId) {
        return ResponseEntity.ok(approvalService.getApprovalsByLabelId(labelId));
    }

    @PostMapping("/submit")
    public ResponseEntity<Approval> submitForApproval(
            @RequestParam UUID labelId,
            @RequestParam Integer versionNo,
            @RequestParam(required = false) String comments,
            @AuthenticationPrincipal User currentUser) {
        // If currentUser is not available from security context for some reason, 
        // we'd need to fetch it. Assuming it's properly set.
        return ResponseEntity.ok(approvalService.submitForApproval(labelId, versionNo, currentUser, comments));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Approval> approveLabel(
            @PathVariable UUID id,
            @RequestParam(required = false) String comments,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(approvalService.approveLabel(id, currentUser, comments));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Approval> rejectLabel(
            @PathVariable UUID id,
            @RequestParam(required = false) String comments,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(approvalService.rejectLabel(id, currentUser, comments));
    }
}
