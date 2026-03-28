package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.TemplateVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TemplateVersionRepository extends JpaRepository<TemplateVersion, UUID> {
    List<TemplateVersion> findByTemplateIdOrderByVersionNumberDesc(UUID templateId);
    
    List<TemplateVersion> findBySavedTemplateIdOrderByVersionNumberDesc(UUID savedTemplateId);

    @Query("SELECT COALESCE(MAX(v.versionNumber), 0) FROM TemplateVersion v WHERE v.template.id = :templateId")
    Integer findMaxVersionNumberSystem(UUID templateId);

    @Query("SELECT COALESCE(MAX(v.versionNumber), 0) FROM TemplateVersion v WHERE v.savedTemplate.id = :savedTemplateId")
    Integer findMaxVersionNumberUser(UUID savedTemplateId);
}
