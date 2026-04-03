package com.pharmalabel.api.models;

import com.pharmalabel.api.models.enums.PrintRequestStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;
import java.util.UUID;

@Entity
@Table(name = "print_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrintRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "label_id")
    private Label label;

    @ManyToOne(optional = false)
    @JoinColumn(name = "label_stock_id")
    private LabelStock labelStock;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, length = 100)
    private String printerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PrintRequestStatus status;

    @ManyToOne(optional = false)
    @JoinColumn(name = "requested_by_id")
    private User requestedBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime requestedAt;
}
