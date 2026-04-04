package com.pharmalabel.api.models;

import com.pharmalabel.api.models.enums.ObjectStatus;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "objects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class ObjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String type;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String tags;

    @Builder.Default
    private Integer version = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "activation_status", nullable = false)
    @Builder.Default
    private ObjectStatus activationStatus = ObjectStatus.DRAFT;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(columnDefinition = "JSONB")
    private String metadata;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "label_id")
    private Label label;
}
