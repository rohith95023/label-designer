package com.pharmalabel.api.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Entity
@Table(name = "languages", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"code", "country_code"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Language {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "parent_language_id")
    private UUID parentLanguageId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(name = "region_name")
    private String regionName;

    @Builder.Default
    @Column(name = "date_format")
    private String dateFormat = "dd/MM/yyyy";

    @Builder.Default
    @Column(name = "time_format")
    private String timeFormat = "HH:mm";

    @Builder.Default
    @Column(name = "currency_symbol")
    private String currencySymbol = "$";

    @Builder.Default
    @Column(name = "is_default_variant")
    private boolean isDefaultVariant = false;

    @Builder.Default
    @Column(nullable = false)
    private String direction = "LTR"; // LTR, RTL

    @Builder.Default
    @Column(nullable = false)
    private String status = "ACTIVE";
}
