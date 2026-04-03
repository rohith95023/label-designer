package com.pharmalabel.api.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;
import com.pharmalabel.api.models.enums.LabelStockStatus;

@Entity
@Table(name = "label_stocks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabelStock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 100)
    private String name;

    @Column(unique = true, nullable = false, length = 50)
    private String stockId;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantityOnHand;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal reorderLevel;

    @Column(precision = 12, scale = 2)
    private BigDecimal maxStockLevel;

    @Column(nullable = false, length = 20)
    private String unitOfMeasure;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal length;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal breadth;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal height;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LabelStockStatus status;

    @Column(length = 100)
    private String supplier;

    @Column(length = 100)
    private String costCenter;
}

