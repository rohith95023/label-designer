package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.ElectronicSignature;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ElectronicSignatureRepository extends JpaRepository<ElectronicSignature, UUID> {
}
