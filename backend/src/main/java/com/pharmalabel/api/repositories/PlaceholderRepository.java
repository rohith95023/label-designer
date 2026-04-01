package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.Placeholder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PlaceholderRepository extends JpaRepository<Placeholder, UUID> {
    List<Placeholder> findByType(String type);
}
