package com.smartdesk.service;

import com.smartdesk.dto.AuthDtos.*;
import com.smartdesk.dto.UserDtos.*;
import com.smartdesk.exception.ApiException;
import com.smartdesk.model.Role;
import com.smartdesk.model.User;
import com.smartdesk.repository.UserRepository;
import com.smartdesk.security.JwtService;
import com.smartdesk.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /** Self-registration always creates a normal USER account. Admins create technicians/admins. */
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = new User(req.fullName().trim(), email, passwordEncoder.encode(req.password()),
                Role.USER, blankToNull(req.department()));
        users.save(user);
        return tokenFor(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmailIgnoreCase(req.email().trim())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!user.isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This account has been deactivated. Contact the administrator.");
        }
        return tokenFor(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(UserPrincipal me) {
        return UserResponse.from(load(me.getId()));
    }

    public UserResponse updateProfile(UserPrincipal me, UpdateProfileRequest req) {
        User user = load(me.getId());
        user.setFullName(req.fullName().trim());
        user.setDepartment(blankToNull(req.department()));
        return UserResponse.from(user);
    }

    public void changePassword(UserPrincipal me, ChangePasswordRequest req) {
        User user = load(me.getId());
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
    }

    private User load(Long id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
    }

    private AuthResponse tokenFor(User user) {
        String token = jwtService.generateToken(new UserPrincipal(user));
        return new AuthResponse(token, jwtService.getExpirationMillis(), UserResponse.from(user));
    }

    static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
