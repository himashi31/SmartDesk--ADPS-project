package com.smartdesk.dto;

import com.smartdesk.model.Role;
import com.smartdesk.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class UserDtos {
    private UserDtos() {}

    public record UserResponse(Long id, String fullName, String email, Role role, String department,
                               boolean active, LocalDateTime createdAt) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole(),
                    u.getDepartment(), u.isActive(), u.getCreatedAt());
        }
    }

    /** Small user representation embedded in tickets and comments. */
    public record UserSummary(Long id, String fullName, String email, Role role) {
        public static UserSummary from(User u) {
            return u == null ? null : new UserSummary(u.getId(), u.getFullName(), u.getEmail(), u.getRole());
        }
    }

    public record CreateUserRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Email @Size(max = 150) String email,
            @NotBlank @Size(min = 8, max = 72, message = "Password must be 8–72 characters") String password,
            @NotNull Role role,
            @Size(max = 100) String department) {}

    public record UpdateUserRequest(
            @Size(max = 100) String fullName,
            @Size(max = 100) String department,
            Role role,
            Boolean active) {}

    public record UpdateProfileRequest(
            @NotBlank @Size(max = 100) String fullName,
            @Size(max = 100) String department) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 72, message = "Password must be 8–72 characters") String newPassword) {}
}
