package com.pharmalabel.api.dtos.label;

import lombok.Data;

@Data
public class SaveVersionRequest {
    private Object designJson;
    private String notes;
}
