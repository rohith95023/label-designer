package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.SavedTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SavedTemplateRepository extends JpaRepository<SavedTemplate, UUID> {
    List<SavedTemplate> findByUserIdOrderByUpdatedAtDesc(String userId);
    List<SavedTemplate> findByUserId(String userId);
}
