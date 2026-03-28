package com.pharmalabel.api.services;

import com.pharmalabel.api.models.User;
import java.util.List;
import java.util.UUID;

public interface UserService {
    User getCurrentUser();
    User getUserById(UUID id);
    User getUserByUsername(String username);
    String initiateClaim(String guestId);
    void executeClaim(String claimToken);

    // User Management (Admin Only)
    List<com.pharmalabel.api.dtos.user.UserDto> getAllUsers();
    com.pharmalabel.api.dtos.user.UserDto createUser(com.pharmalabel.api.dtos.user.CreateUserRequest request);
    com.pharmalabel.api.dtos.user.UserDto updateUser(UUID id, com.pharmalabel.api.dtos.user.UpdateUserRequest request);
    void deleteUser(UUID id);
    void lockUser(UUID id);
    void unlockUser(UUID id);
    List<String> getAllRoles();
}
