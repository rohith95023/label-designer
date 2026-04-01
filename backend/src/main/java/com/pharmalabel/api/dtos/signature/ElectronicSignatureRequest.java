package com.pharmalabel.api.dtos.signature;

import com.pharmalabel.api.models.enums.SignatureMeaning;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class ElectronicSignatureRequest {
    @NotNull(message = "Entity Type is required")
    private String entityType;

    @NotNull(message = "Entity ID is required")
    private UUID entityId;

    @NotNull(message = "Meaning is required")
    private SignatureMeaning meaning;

    @NotBlank(message = "Password is required for verification")
    private String password;
}
