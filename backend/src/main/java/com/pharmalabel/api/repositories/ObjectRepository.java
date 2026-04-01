package com.pharmalabel.api.repositories;

import com.pharmalabel.api.models.ObjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ObjectRepository extends JpaRepository<ObjectEntity, UUID> {
    List<ObjectEntity> findByType(String type);
    List<ObjectEntity> findByStatus(String status);
}
