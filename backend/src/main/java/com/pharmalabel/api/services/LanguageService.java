package com.pharmalabel.api.services;

import com.pharmalabel.api.models.Language;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LanguageService {
    List<Language> getAllLanguages();
    Optional<Language> getLanguageById(UUID id);
    Optional<Language> getLanguageByCode(String code);
    Language createLanguage(Language language);
    Language updateLanguage(UUID id, Language language);
    void deleteLanguage(UUID id);
}
