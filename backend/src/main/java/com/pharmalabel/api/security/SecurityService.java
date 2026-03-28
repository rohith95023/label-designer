package com.pharmalabel.api.security;

import com.pharmalabel.api.models.User;
import com.pharmalabel.api.services.PermissionService;
import com.pharmalabel.api.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service("securityService")
@RequiredArgsConstructor
public class SecurityService {

    private final PermissionService permissionService;
    private final UserService userService;

    public boolean hasAccess(String module, String event) {
        User currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return false;
        }

        // Admin override: Always allow admins to bypass permission checks
        if (currentUser.getRole() != null && currentUser.getRole().getName().equalsIgnoreCase("ADMIN")) {
            return true;
        }

        return permissionService.hasAccess(currentUser, module, event);
    }
}
