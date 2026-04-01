package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.Phrase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PhraseRepository extends JpaRepository<Phrase, UUID> {
    Optional<Phrase> findByPhraseKey(String phraseKey);
}
