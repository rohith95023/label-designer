package com.pharmalabel.api.dtos.signature;

import com.pharmalabel.api.models.enums.SignatureMeaning;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class ElectronicSignatureRequest {
    @NotNull(message = "Target ID is required")
    private UUID targetId;

    private UUID versionId;

    @NotNull(message = "Meaning is required")
    private SignatureMeaning meaning;

    private String reason;

    @NotBlank(message = "Password is required for verification")
    private String password;
}
