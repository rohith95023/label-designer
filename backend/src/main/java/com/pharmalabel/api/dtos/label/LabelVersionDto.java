package com.pharmalabel.api.dtos.label;

import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class LabelVersionDto {
    private UUID id;
    private UUID labelId;
    private Integer versionNo;
    private Object designJson;
    private UUID createdById;
    private String createdByUsername;
    private OffsetDateTime createdAt;
}
