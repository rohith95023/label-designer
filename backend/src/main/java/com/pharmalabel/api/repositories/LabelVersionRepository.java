package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.LabelVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LabelVersionRepository extends JpaRepository<LabelVersion, UUID> {
    List<LabelVersion> findByLabelIdOrderByVersionNoDesc(UUID labelId);
    Optional<LabelVersion> findByLabelIdAndVersionNo(UUID labelId, Integer versionNo);
    @org.springframework.data.jpa.repository.Query("SELECT lv FROM LabelVersion lv JOIN FETCH lv.label WHERE lv.label.id = :labelId ORDER BY lv.versionNo DESC LIMIT 1")
    Optional<LabelVersion> findFirstByLabelIdOrderByVersionNoDesc(@org.springframework.data.repository.query.Param("labelId") UUID labelId);
}
