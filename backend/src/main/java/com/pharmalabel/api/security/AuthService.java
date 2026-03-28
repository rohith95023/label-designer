package com.pharmalabel.api.security;

import com.pharmalabel.api.dtos.auth.LoginRequest;
import com.pharmalabel.api.dtos.auth.LoginResponse;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request, HttpServletResponse response);
    LoginResponse refresh(String refreshToken, HttpServletResponse response);
    void logout(String refreshToken, HttpServletResponse response);
}
