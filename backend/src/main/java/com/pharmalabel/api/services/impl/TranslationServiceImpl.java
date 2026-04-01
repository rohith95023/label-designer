package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.Translation;
import com.pharmalabel.api.repositories.TranslationRepository;
import com.pharmalabel.api.services.TranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TranslationServiceImpl implements TranslationService {

    private final TranslationRepository translationRepository;

    @Override
    public List<Translation> getAllTranslations() {
        return translationRepository.findAll();
    }

    @Override
    public List<Translation> getTranslationsByPhraseId(UUID phraseId) {
        return translationRepository.findByPhraseId(phraseId);
    }

    @Override
    public List<Translation> getTranslationsByLanguageId(UUID languageId) {
        return translationRepository.findByLanguageId(languageId);
    }

    @Override
    public Optional<Translation> getTranslationById(UUID id) {
        return translationRepository.findById(id);
    }

    @Override
    @Transactional
    public Translation createTranslation(Translation translation) {
        return translationRepository.save(translation);
    }

    @Override
    @Transactional
    public Translation updateTranslation(UUID id, Translation translation) {
        return translationRepository.findById(id)
                .map(existing -> {
                    existing.setPhrase(translation.getPhrase());
                    existing.setLanguage(translation.getLanguage());
                    existing.setTranslatedText(translation.getTranslatedText());
                    return translationRepository.save(existing);
                }).orElseThrow(() -> new RuntimeException("Translation not found with id: " + id));
    }

    @Override
    @Transactional
    public void deleteTranslation(UUID id) {
        translationRepository.deleteById(id);
    }
}
