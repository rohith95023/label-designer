package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.LabelStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LabelStockRepository extends JpaRepository<LabelStock, UUID> {
    Optional<LabelStock> findByStockId(String stockId);
    boolean existsByStockIdAndIdNot(String stockId, UUID id);
    boolean existsByNameAndIdNot(String name, UUID id);
    boolean existsByName(String name);
    boolean existsByStockId(String stockId);
}
