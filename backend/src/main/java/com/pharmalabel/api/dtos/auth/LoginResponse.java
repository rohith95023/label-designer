package com.pharmalabel.api.dtos.auth;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class LoginResponse {
    private String accessToken;
    private UserResponse user;

    @Data
    @Builder
    public static class UserResponse {
        private UUID id;
        private String username;
        private String email;
        private String role;
        private boolean mustChangePassword;
    }
}
