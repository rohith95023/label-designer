package com.pharmalabel.api.services;

import com.pharmalabel.api.models.ObjectEntity;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.pharmalabel.api.models.enums.ObjectStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ObjectService {
    List<ObjectEntity> getAllObjects();
    List<ObjectEntity> getObjectsByStatus(ObjectStatus status);
    Optional<ObjectEntity> getObjectById(UUID id);
    List<ObjectEntity> getVersionsForObject(UUID parentId);
    
    ObjectEntity createObject(String name, String type, String description, String tags, MultipartFile file, UUID labelId);
    ObjectEntity replaceObject(UUID id, MultipartFile file);
    ObjectEntity updateMetadata(UUID id, String name, String type, String description, String tags);
    ObjectEntity activateVersion(UUID id);
    void deleteObject(UUID id);
}
