package com.pharmalabel.api.services.impl;

import com.pharmalabel.api.models.Label;
import com.pharmalabel.api.models.ObjectEntity;
import com.pharmalabel.api.models.enums.ObjectStatus;
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
@Transactional
public class ObjectServiceImpl implements ObjectService {

    private final ObjectRepository objectRepository;
    private final LabelRepository labelRepository;

    @Value("${upload.path:uploads}")
    private String uploadPath;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_EXTENSIONS = List.of("png", "jpg", "jpeg", "svg", "pdf");

    @Override
    public List<ObjectEntity> getAllObjects() {
        return objectRepository.findAll();
    }

    @Override
    public List<ObjectEntity> getObjectsByStatus(ObjectStatus status) {
        return objectRepository.findByActivationStatus(status);
    }

    @Override
    public Optional<ObjectEntity> getObjectById(UUID id) {
        return objectRepository.findById(id);
    }

    @Override
    public List<ObjectEntity> getVersionsForObject(UUID parentId) {
        return objectRepository.findByParentIdOrderByVersionDesc(parentId);
    }

    @Override
    @Transactional
    public ObjectEntity createObject(String name, String type, String description, String tags, MultipartFile file, UUID labelId) {
        validateFile(file);
        String fileUrl = storeFile(file);

        Label label = null;
        if (labelId != null) {
            label = labelRepository.findById(labelId).orElse(null);
        }

        ObjectEntity objectEntity = ObjectEntity.builder()
                .name(name)
                .type(type)
                .description(description)
                .tags(tags)
                .fileUrl(fileUrl)
                .version(1)
                .activationStatus(ObjectStatus.ACTIVE)
                .label(label)
                .build();

        ObjectEntity saved = objectRepository.save(objectEntity);
        // On initial creation, parentId is the first version's ID
        saved.setParentId(saved.getId());
        ObjectEntity result = objectRepository.save(saved);

        // Update Label's main image URL if this object is linked to a label
        if (label != null) {
            label.setImageUrl(fileUrl);
            labelRepository.save(label);
        }

        return result;
    }

    @Override
    @Transactional
    public ObjectEntity replaceObject(UUID id, MultipartFile file) {
        ObjectEntity original = objectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Original object version not found"));
        
        validateFile(file);
        String fileUrl = storeFile(file);

        Integer latestVersion = objectRepository.findMaxVersionByParentId(original.getParentId());
        
        ObjectEntity nextVersion = ObjectEntity.builder()
                .name(original.getName())
                .type(original.getType())
                .description(original.getDescription())
                .tags(original.getTags())
                .fileUrl(fileUrl)
                .parentId(original.getParentId())
                .version(latestVersion + 1)
                .activationStatus(ObjectStatus.DRAFT)
                .label(original.getLabel())
                .build();

        return objectRepository.save(nextVersion);
    }

    @Override
    @Transactional
    public ObjectEntity updateMetadata(UUID id, String name, String type, String description, String tags) {
        return objectRepository.findById(id)
                .map(existing -> {
                    existing.setName(name);
                    existing.setType(type);
                    existing.setDescription(description);
                    existing.setTags(tags);
                    return objectRepository.save(existing);
                }).orElseThrow(() -> new RuntimeException("Object not found with id: " + id));
    }

    @Override
    @Transactional
    public ObjectEntity activateVersion(UUID id) {
        ObjectEntity target = objectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Version not found"));
        
        // Deactivate current active version for this parent
        objectRepository.findByParentIdAndActivationStatus(target.getParentId(), ObjectStatus.ACTIVE)
                .ifPresent(currentActive -> {
                    currentActive.setActivationStatus(ObjectStatus.INACTIVE);
                    objectRepository.save(currentActive);
                });

        target.setActivationStatus(ObjectStatus.ACTIVE);
        return objectRepository.save(target);
    }

    @Override
    @Transactional
    public void deleteObject(UUID id) {
        objectRepository.deleteById(id);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File exceeds maximum size of 5MB.");
        }
        String extension = getFileExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new RuntimeException("File type not allowed. Supported: " + ALLOWED_EXTENSIONS);
        }
    }

    private String storeFile(MultipartFile file) {
        try {
            Path root = Paths.get(uploadPath);
            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }
            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), root.resolve(filename));
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}
