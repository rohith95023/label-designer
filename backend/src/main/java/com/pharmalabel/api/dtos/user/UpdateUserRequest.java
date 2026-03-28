package com.pharmalabel.api.dtos.user;

import lombok.Data;
import jakarta.validation.constraints.Email;

@Data
public class UpdateUserRequest {
    private String username;

    @Email(message = "Email should be valid")
    private String email;

    // Optional - if provided, password will be updated
    private String password;

    private String role;
}
