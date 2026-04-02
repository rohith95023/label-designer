package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.Label;
import com.pharmalabel.api.models.ObjectEntity;
import com.pharmalabel.api.repositories.LabelRepository;
import com.pharmalabel.api.repositories.ObjectRepository;
import com.pharmalabel.api.services.ObjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ObjectServiceImpl implements ObjectService {

    private final ObjectRepository objectRepository;
    private final LabelRepository labelRepository;

    @Value("${upload.path:uploads}")
    private String uploadPath;

    @Override
    public List<ObjectEntity> getAllObjects() {
        return objectRepository.findAll();
    }

    @Override
    public Optional<ObjectEntity> getObjectById(UUID id) {
        return objectRepository.findById(id);
    }

    @Override
    @Transactional
    public ObjectEntity createObject(String name, String type, MultipartFile file, UUID labelId) {
        try {
            Path root = Paths.get(uploadPath);
            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }

            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), root.resolve(filename));

            Label label = null;
            if (labelId != null) {
                label = labelRepository.findById(labelId).orElse(null);
            }

            ObjectEntity objectEntity = ObjectEntity.builder()
                    .name(name)
                    .type(type)
                    .fileUrl("/uploads/" + filename)
                    .label(label)
                    .status("ACTIVE")
                    .build();

            return objectRepository.save(objectEntity);
        } catch (IOException e) {
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ObjectEntity updateObject(UUID id, ObjectEntity objectEntity) {
        return objectRepository.findById(id)
                .map(existing -> {
                    existing.setName(objectEntity.getName());
                    existing.setType(objectEntity.getType());
                    existing.setStatus(objectEntity.getStatus());
                    // File URL is usually not updated this way, but we'll allow it for now
                    if (objectEntity.getFileUrl() != null) {
                        existing.setFileUrl(objectEntity.getFileUrl());
                    }
                    return objectRepository.save(existing);
                }).orElseThrow(() -> new RuntimeException("Object not found with id: " + id));
    }

    @Override
    @Transactional
    public void deleteObject(UUID id) {
        objectRepository.deleteById(id);
    }
}
