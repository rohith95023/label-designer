package com.pharmalabel.api.services;

import com.pharmalabel.api.models.Approval;
import com.pharmalabel.api.models.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApprovalService {
    List<Approval> getAllApprovals();
    List<Approval> getApprovalsByLabelId(UUID labelId);
    List<Approval> getApprovalsByStatus(String status);
    Optional<Approval> getApprovalById(UUID id);
    Approval submitForApproval(UUID labelId, Integer versionNo, User requestedBy, String comments);
    Approval approveLabel(UUID id, User approvedBy, String comments);
    Approval rejectLabel(UUID id, User rejectedBy, String comments);
}
