package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.Translation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TranslationRepository extends JpaRepository<Translation, UUID> {
    List<Translation> findByPhraseId(UUID phraseId);
    List<Translation> findByLanguageId(UUID languageId);
    Optional<Translation> findByPhraseIdAndLanguageId(UUID phraseId, UUID languageId);
}
