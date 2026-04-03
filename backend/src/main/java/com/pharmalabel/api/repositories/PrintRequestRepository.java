package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.PrintRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PrintRequestRepository extends JpaRepository<PrintRequest, UUID> {
    List<PrintRequest> findByRequestedByIdOrderByRequestedAtDesc(UUID userId);
}
