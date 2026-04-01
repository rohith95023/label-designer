package com.pharmalabel.api.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Entity
@Table(name = "placeholders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Placeholder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // DATA, FREE_TEXT, RUNTIME, VISIT

    @Column(name = "mapping_key", unique = true)
    private String mappingKey;

    @Column(name = "default_value")
    private String defaultValue;

    private String description;

    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "format_rules", columnDefinition = "jsonb")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private Object formatRules;
}
