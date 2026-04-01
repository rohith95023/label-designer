package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.Approval;
import com.pharmalabel.api.models.Label;
import com.pharmalabel.api.models.User;
import com.pharmalabel.api.repositories.ApprovalRepository;
import com.pharmalabel.api.repositories.LabelRepository;
import com.pharmalabel.api.services.ApprovalService;
import com.pharmalabel.api.services.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApprovalServiceImpl implements ApprovalService {

    private final ApprovalRepository approvalRepository;
    private final LabelRepository labelRepository;
    private final AuditLogService auditLogService;

    @Override
    public List<Approval> getAllApprovals() {
        return approvalRepository.findAll();
    }

    @Override
    public List<Approval> getApprovalsByLabelId(UUID labelId) {
        return approvalRepository.findByLabelIdOrderByCreatedAtDesc(labelId);
    }

    @Override
    public List<Approval> getApprovalsByStatus(String status) {
        return approvalRepository.findByStatus(status);
    }

    @Override
    public Optional<Approval> getApprovalById(UUID id) {
        return approvalRepository.findById(id);
    }

    @Override
    @Transactional
    public Approval submitForApproval(UUID labelId, Integer versionNo, User requestedBy, String comments) {
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new RuntimeException("Label not found with id: " + labelId));

        // Create new approval request
        Approval approval = Approval.builder()
                .label(label)
                .versionNo(versionNo)
                .status("PENDING")
                .requestedBy(requestedBy)
                .comments(comments)
                .build();

        // Update label status
        label.setStatus("REVIEW_PENDING");
        labelRepository.save(label);

        Approval savedApproval = approvalRepository.save(approval);
        
        auditLogService.logEvent(requestedBy, "SUBMIT_FOR_APPROVAL", "APPROVAL", savedApproval.getId(), null, "PENDING");
        
        return savedApproval;
    }

    @Override
    @Transactional
    public Approval approveLabel(UUID id, User approvedBy, String comments) {
        Approval approval = approvalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Approval not found with id: " + id));

        approval.setStatus("APPROVED");
        approval.setApprovedBy(approvedBy);
        approval.setApprovedAt(OffsetDateTime.now());
        approval.setComments(comments);

        Label label = approval.getLabel();
        label.setStatus("ACTIVE");
        labelRepository.save(label);

        Approval savedApproval = approvalRepository.save(approval);
        
        auditLogService.logEvent(approvedBy, "APPROVE_LABEL", "APPROVAL", savedApproval.getId(), "PENDING", "APPROVED");
        
        return savedApproval;
    }

    @Override
    @Transactional
    public Approval rejectLabel(UUID id, User rejectedBy, String comments) {
        Approval approval = approvalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Approval not found with id: " + id));

        approval.setStatus("REJECTED");
        approval.setApprovedBy(rejectedBy); // Or separate field for rejectedBy
        approval.setApprovedAt(OffsetDateTime.now());
        approval.setComments(comments);

        Label label = approval.getLabel();
        label.setStatus("DRAFT");
        labelRepository.save(label);

        Approval savedApproval = approvalRepository.save(approval);
        
        auditLogService.logEvent(rejectedBy, "REJECT_LABEL", "APPROVAL", savedApproval.getId(), "PENDING", "REJECTED");
        
        return savedApproval;
    }
}
