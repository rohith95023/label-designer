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
    Optional<LabelVersion> findFirstByLabelIdOrderByVersionNoDesc(UUID labelId);
}
