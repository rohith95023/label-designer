package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LanguageRepository extends JpaRepository<Language, UUID> {
    Optional<Language> findByCode(String code);
    List<Language> findByParentLanguageId(UUID parentLanguageId);
}
