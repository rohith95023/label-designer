package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.enums.ObjectStatus;
import com.pharmalabel.api.models.ObjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ObjectRepository extends JpaRepository<ObjectEntity, UUID> {
    List<ObjectEntity> findByType(String type);
    
    List<ObjectEntity> findByActivationStatus(ObjectStatus status);
    
    List<ObjectEntity> findByParentIdOrderByVersionDesc(UUID parentId);
    
    Optional<ObjectEntity> findByParentIdAndActivationStatus(UUID parentId, ObjectStatus status);
    
    @Query("SELECT MAX(o.version) FROM ObjectEntity o WHERE o.parentId = :parentId")
    Integer findMaxVersionByParentId(UUID parentId);
}
