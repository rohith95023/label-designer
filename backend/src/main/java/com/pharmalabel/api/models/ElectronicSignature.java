package com.pharmalabel.api.models;

import com.pharmalabel.api.models.enums.SignatureMeaning;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "electronic_signatures")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ElectronicSignature {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(name = "version_id")
    private UUID versionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SignatureMeaning meaning;

    private String reason;

    @CreationTimestamp
    @Column(name = "signed_at", nullable = false, updatable = false)
    private OffsetDateTime signedAt;

    @Column(name = "ip_address")
    private String ipAddress;
}
