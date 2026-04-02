package com.pharmalabel.api.dtos.label;

import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class LabelDto {
    private UUID id;
    private String name;
    private String brand;
    private String category;
    private String status;
    private String imageUrl;
    private UUID labelStockId;
    private String labelStockName;
    private UUID createdById;
    private String createdByUsername;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private String notes;
    private Integer latestVersionNo;
    private Object latestVersionDesign;
}
