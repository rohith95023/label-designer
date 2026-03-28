package com.pharmalabel.api.dtos.user;

import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class UserDto {
    private UUID id;
    private String username;
    private String email;
    private String role;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime passwordChangedAt;
    private Integer failedLoginAttempts;
    private OffsetDateTime lockedUntil;
}
