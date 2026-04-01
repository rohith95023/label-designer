package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.LabelStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LabelStockRepository extends JpaRepository<LabelStock, UUID> {
    Optional<LabelStock> findByName(String name);
}
