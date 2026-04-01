package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.Phrase;
import com.pharmalabel.api.repositories.PhraseRepository;
import com.pharmalabel.api.services.PhraseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PhraseServiceImpl implements PhraseService {

    private final PhraseRepository phraseRepository;

    @Override
    public List<Phrase> getAllPhrases() {
        return phraseRepository.findAll();
    }

    @Override
    public Optional<Phrase> getPhraseById(UUID id) {
        return phraseRepository.findById(id);
    }

    @Override
    @Transactional
    public Phrase createPhrase(Phrase phrase) {
        return phraseRepository.save(phrase);
    }

    @Override
    @Transactional
    public Phrase updatePhrase(UUID id, Phrase phrase) {
        return phraseRepository.findById(id)
                .map(existing -> {
                    existing.setPhraseKey(phrase.getPhraseKey());
                    existing.setDefaultText(phrase.getDefaultText());
                    return phraseRepository.save(existing);
                }).orElseThrow(() -> new RuntimeException("Phrase not found with id: " + id));
    }

    @Override
    @Transactional
    public void deletePhrase(UUID id) {
        phraseRepository.deleteById(id);
    }
}
