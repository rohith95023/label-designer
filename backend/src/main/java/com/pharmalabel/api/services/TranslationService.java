package com.pharmalabel.api.services;

import com.pharmalabel.api.models.Translation;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TranslationService {
    List<Translation> getAllTranslations();
    List<Translation> getTranslationsByPhraseId(UUID phraseId);
    List<Translation> getTranslationsByLanguageId(UUID languageId);
    Optional<Translation> getTranslationById(UUID id);
    Translation createTranslation(Translation translation);
    Translation updateTranslation(UUID id, Translation translation);
    void deleteTranslation(UUID id);
}
