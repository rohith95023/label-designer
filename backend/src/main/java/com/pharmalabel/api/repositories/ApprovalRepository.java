package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.Approval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, UUID> {
    List<Approval> findByLabelIdOrderByCreatedAtDesc(UUID labelId);
    Optional<Approval> findFirstByLabelIdAndVersionNoOrderByCreatedAtDesc(UUID labelId, Integer versionNo);
    List<Approval> findByStatus(String status);
}
