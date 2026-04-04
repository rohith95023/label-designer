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
        validateLanguage(language);
        return languageRepository.save(language);
    }

    @Override
    @Transactional
    public Language updateLanguage(UUID id, Language language) {
        return languageRepository.findById(id)
                .map(existing -> {
                    // Prevent deactivating system default language
                    if ("INACTIVE".equals(language.getStatus()) && isSystemDefault(existing.getCode())) {
                        throw new RuntimeException("Cannot deactivate the system default language (" + existing.getCode() + ")");
                    }
                    
                    validateLanguage(language);
                    
                    existing.setName(language.getName());
                    existing.setCode(language.getCode());
                    existing.setParentLanguageId(language.getParentLanguageId());
                    existing.setCountryCode(language.getCountryCode());
                    existing.setRegionName(language.getRegionName());
                    existing.setDateFormat(language.getDateFormat());
                    existing.setTimeFormat(language.getTimeFormat());
                    existing.setCurrencySymbol(language.getCurrencySymbol());
                    existing.setDefaultVariant(language.isDefaultVariant());
                    existing.setDirection(language.getDirection());
                    existing.setStatus(language.getStatus());
                    return languageRepository.save(existing);
                }).orElseThrow(() -> new RuntimeException("Language not found with id: " + id));
    }

    @Override
    public List<Language> getVariants(UUID parentId) {
        return languageRepository.findByParentLanguageId(parentId);
    }

    @Override
    @Transactional
    public void deleteLanguage(UUID id) {
        Language lang = languageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Language not found"));
        if (isSystemDefault(lang.getCode())) {
            throw new RuntimeException("Cannot delete the system default language");
        }
        languageRepository.deleteById(id);
    }

    private void validateLanguage(Language lang) {
        if (lang.getCode() == null || !lang.getCode().matches("^[a-z]{2}$")) {
            throw new RuntimeException("Language code must be a 2-letter ISO 639-1 code (e.g., 'en')");
        }
        if (lang.getCountryCode() != null && !lang.getCountryCode().isEmpty() && !lang.getCountryCode().matches("^[A-Z]{2}$")) {
            throw new RuntimeException("Country code must be a 2-letter ISO 3166-1 alpha-2 code (e.g., 'US')");
        }
    }

    private boolean isSystemDefault(String code) {
        // In a real app, this might come from SystemConfigService
        return "en".equalsIgnoreCase(code);
    }
}
