package com.pharmalabel.api.services;

import com.pharmalabel.api.models.ObjectEntity;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ObjectService {
    List<ObjectEntity> getAllObjects();
    Optional<ObjectEntity> getObjectById(UUID id);
    ObjectEntity createObject(String name, String type, MultipartFile file, UUID labelId);
    ObjectEntity updateObject(UUID id, ObjectEntity objectEntity);
    void deleteObject(UUID id);
}
