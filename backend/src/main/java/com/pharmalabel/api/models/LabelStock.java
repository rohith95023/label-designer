package com.pharmalabel.api.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

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

    @Column(nullable = false)
    private String name;

    private BigDecimal length;
    private BigDecimal width;
    private BigDecimal height;

    private String description;
}
