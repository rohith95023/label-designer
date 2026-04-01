package com.pharmalabel.api.services;

import com.pharmalabel.api.models.Phrase;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PhraseService {
    List<Phrase> getAllPhrases();
    Optional<Phrase> getPhraseById(UUID id);
    Phrase createPhrase(Phrase phrase);
    Phrase updatePhrase(UUID id, Phrase phrase);
    void deletePhrase(UUID id);
}
