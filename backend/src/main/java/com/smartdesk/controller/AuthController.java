package com.smartdesk.controller;

import com.smartdesk.dto.AuthDtos.*;
import com.smartdesk.dto.UserDtos.*;
import com.smartdesk.security.CurrentUser;
import com.smartdesk.security.UserPrincipal;
import com.smartdesk.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public UserResponse me(@CurrentUser UserPrincipal me) {
        return authService.me(me);
    }

    @PutMapping("/me")
    public UserResponse updateProfile(@CurrentUser UserPrincipal me, @Valid @RequestBody UpdateProfileRequest req) {
        return authService.updateProfile(me, req);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@CurrentUser UserPrincipal me, @Valid @RequestBody ChangePasswordRequest req) {
        authService.changePassword(me, req);
        return ResponseEntity.noContent().build();
    }
}
