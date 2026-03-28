package com.pharmalabel.api.security;

import com.pharmalabel.api.dtos.auth.LoginRequest;
import com.pharmalabel.api.dtos.auth.LoginResponse;
import com.pharmalabel.api.models.User;
import com.pharmalabel.api.models.UserAuthToken;
import com.pharmalabel.api.repositories.RoleRepository;
import com.pharmalabel.api.repositories.UserAuthTokenRepository;
import com.pharmalabel.api.repositories.UserRepository;
import com.pharmalabel.api.services.AuditLogService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserAuthTokenRepository authTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final AuditLogService auditLogService;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletResponse response) {
        // Support login by username OR email
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        // Check if account is locked
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(OffsetDateTime.now())) {
            throw new RuntimeException("Account is locked until " + user.getLockedUntil());
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user);
            throw new BadCredentialsException("Invalid username or password");
        }

        // Reset failed attempts on success
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        // Audit: Log successful login
        auditLogService.logEvent(user, "LOGIN", "AUTH", "USER_LOGIN", null,
                "User '" + user.getUsername() + "' logged in successfully");

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String accessToken = jwtService.generateToken(userDetails, user.getTokenVersion());
        
        // Generate Refresh Token with Family ID
        String refreshToken = UUID.randomUUID().toString();
        UUID familyId = UUID.randomUUID();
        
        saveRefreshToken(user, refreshToken, familyId);
        setRefreshCookie(response, refreshToken);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .user(LoginResponse.UserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole().getName())
                        .mustChangePassword(user.getMustChangePassword())
                        .build())
                .build();
    }

    private void handleFailedLogin(User user) {
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        if (user.getFailedLoginAttempts() >= 5) {
            user.setLockedUntil(OffsetDateTime.now().plusMinutes(30));
        }
        userRepository.save(user);

        // Audit: Log failed login attempt
        auditLogService.logEvent(user, "FAILED_LOGIN", "AUTH", "LOGIN_FAILED", null,
                "Failed login attempt for '" + user.getUsername() + "' (attempt " + user.getFailedLoginAttempts() + ")"
                + (user.getFailedLoginAttempts() >= 5 ? " - Account locked" : ""));
    }

    private void saveRefreshToken(User user, String token, UUID familyId) {
        // Find existing family and rotate
        UserAuthToken authToken = UserAuthToken.builder()
                .user(user)
                .tokenHash(passwordEncoder.encode(token)) 
                .familyId(familyId)
                .revoked(false)
                .expiresAt(OffsetDateTime.now().plusSeconds(refreshExpiration / 1000))
                .build();
        authTokenRepository.save(authToken);
    }

    private void setRefreshCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(false) // Set to true in prod/HTTPS env
                .path("/")
                .maxAge(refreshExpiration / 1000)
                .sameSite("Strict")
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    @Override
    @Transactional
    public LoginResponse refresh(String refreshToken, HttpServletResponse response) {
        if (refreshToken == null) throw new BadCredentialsException("Refresh token missing");

        // GxP Requirement: Replay Detection
        // Find the token in DB – note searching by hash since we stored the hashed UUID
        // This is complex because we need to check all revoked/non-revoked tokens for families.
        // For simplicity in this demo, I'll search through active tokens.
        
        List<UserAuthToken> allTokens = authTokenRepository.findAll();
        UserAuthToken matchedToken = allTokens.stream()
                .filter(t -> passwordEncoder.matches(refreshToken, t.getTokenHash()))
                .findFirst()
                .orElseThrow(() -> {
                    // This could be a replay of a token we already deleted or one that doesn't exist
                    // In a production environment, you'd track even revoked tokens to detect replays.
                    return new BadCredentialsException("Invalid refresh token");
                });

        if (matchedToken.getRevoked() || matchedToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            // REPLAY DETECTION! Revoke everything for this user.
            revokeAllTokensForUser(matchedToken.getUser().getId());
            throw new BadCredentialsException("Token compromised or expired. All sessions revoked.");
        }

        // Rotate: Revoke the old one, issue new one in the same family
        matchedToken.setRevoked(true);
        authTokenRepository.save(matchedToken);

        User user = matchedToken.getUser();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String newAccessToken = jwtService.generateToken(userDetails, user.getTokenVersion());
        
        String newRefreshToken = UUID.randomUUID().toString();
        saveRefreshToken(user, newRefreshToken, matchedToken.getFamilyId());
        setRefreshCookie(response, newRefreshToken);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .user(LoginResponse.UserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole().getName())
                        .mustChangePassword(user.getMustChangePassword())
                        .build())
                .build();
    }

    private void revokeAllTokensForUser(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            List<UserAuthToken> tokens = authTokenRepository.findByUser(user);
            tokens.forEach(t -> t.setRevoked(true));
            authTokenRepository.saveAll(tokens);
            // Also bump token version to invalidate active access tokens
            user.setTokenVersion(user.getTokenVersion() + 1);
            userRepository.save(user);
        }
    }

    @Override
    @Transactional
    public void logout(String refreshToken, HttpServletResponse response) {
        User currentUser = null;
        if (refreshToken != null) {
            List<UserAuthToken> allTokens = authTokenRepository.findAll();
            UserAuthToken matchedToken = allTokens.stream()
                .filter(t -> passwordEncoder.matches(refreshToken, t.getTokenHash()))
                .findFirst()
                .orElse(null);

            if (matchedToken != null) {
                matchedToken.setRevoked(true);
                authTokenRepository.save(matchedToken);
                currentUser = matchedToken.getUser();
            }
        }

        // Audit: Log logout event
        if (currentUser != null) {
            auditLogService.logEvent(currentUser, "LOGOUT", "AUTH", "USER_LOGOUT", null,
                    "User '" + currentUser.getUsername() + "' logged out");
        }
        
        // Clear cookie
        ResponseCookie cookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }
}
