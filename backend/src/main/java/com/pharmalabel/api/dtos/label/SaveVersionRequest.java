package com.pharmalabel.api.dtos.label;

import lombok.Data;

import java.util.UUID;

@Data
public class SaveVersionRequest {
    private Object designJson;
    private String notes;
    private UUID labelStockId;
}
