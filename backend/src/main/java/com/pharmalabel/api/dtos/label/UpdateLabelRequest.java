package com.pharmalabel.api.dtos.label;

import lombok.Data;
import java.util.UUID;

@Data
public class UpdateLabelRequest {
    private String name;
    private UUID labelStockId;
    private String status;
    private String notes;
    private Object designJson;
}
