package com.pharmalabel.api.dtos.label;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class CreateLabelRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Label stock ID is required")
    private UUID labelStockId;

    @NotBlank(message = "Status is required")
    private String status; // DRAFT, PREDEFINED, ACTIVE

    private Object designJson;
}
