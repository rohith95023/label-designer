package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.Language;
import com.pharmalabel.api.repositories.LanguageRepository;
import com.pharmalabel.api.services.LanguageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LanguageServiceImpl implements LanguageService {

    private final LanguageRepository languageRepository;

    @Override
    public List<Language> getAllLanguages() {
        return languageRepository.findAll();
    }

    @Override
    public Optional<Language> getLanguageById(UUID id) {
        return languageRepository.findById(id);
    }

    @Override
    public Optional<Language> getLanguageByCode(String code) {
        return languageRepository.findByCode(code);
    }

    @Override
    @Transactional
    public Language createLanguage(Language language) {
        return languageRepository.save(language);
    }

    @Override
    @Transactional
    public Language updateLanguage(UUID id, Language language) {
        return languageRepository.findById(id)
                .map(existing -> {
                    existing.setName(language.getName());
                    existing.setCode(language.getCode());
                    existing.setDirection(language.getDirection());
                    existing.setStatus(language.getStatus());
                    return languageRepository.save(existing);
                }).orElseThrow(() -> new RuntimeException("Language not found with id: " + id));
    }

    @Override
    @Transactional
    public void deleteLanguage(UUID id) {
        languageRepository.deleteById(id);
    }
}
