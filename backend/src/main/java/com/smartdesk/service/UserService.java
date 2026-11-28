package com.smartdesk.service;

import com.smartdesk.dto.UserDtos.*;
import com.smartdesk.exception.ApiException;
import com.smartdesk.model.Role;
import com.smartdesk.model.User;
import com.smartdesk.repository.CommentRepository;
import com.smartdesk.repository.TicketHistoryRepository;
import com.smartdesk.repository.TicketRepository;
import com.smartdesk.repository.UserRepository;
import com.smartdesk.security.UserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/** Administrator user management. */
@Service
@Transactional
public class UserService {

    private final UserRepository users;
    private final TicketRepository tickets;
    private final CommentRepository comments;
    private final TicketHistoryRepository history;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository users, TicketRepository tickets, CommentRepository comments,
                       TicketHistoryRepository history, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.tickets = tickets;
        this.comments = comments;
        this.history = history;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return users.findAllByOrderByCreatedAtDesc().stream().map(UserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<UserSummary> technicians() {
        return users.findByRoleAndActiveTrueOrderByFullNameAsc(Role.TECHNICIAN).stream().map(UserSummary::from).toList();
    }

    public UserResponse create(CreateUserRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User u = new User(req.fullName().trim(), email, passwordEncoder.encode(req.password()), req.role(),
                AuthService.blankToNull(req.department()));
        return UserResponse.from(users.save(u));
    }

    public UserResponse update(Long id, UpdateUserRequest req, UserPrincipal me) {
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
        boolean self = Objects.equals(u.getId(), me.getId());
        if (self && req.role() != null && req.role() != Role.ADMIN) {
            throw ApiException.badRequest("You cannot remove your own administrator role");
        }
        if (self && Boolean.FALSE.equals(req.active())) {
            throw ApiException.badRequest("You cannot deactivate your own account");
        }
        if (req.fullName() != null && !req.fullName().isBlank()) u.setFullName(req.fullName().trim());
        if (req.department() != null) u.setDepartment(AuthService.blankToNull(req.department()));
        if (req.role() != null) u.setRole(req.role());
        if (req.active() != null) u.setActive(req.active());
        return UserResponse.from(u);
    }

    public void resetPassword(Long id, String newPassword) {
        if (newPassword == null || newPassword.length() < 8 || newPassword.length() > 72) {
            throw ApiException.badRequest("Password must be 8–72 characters");
        }
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
        u.setPasswordHash(passwordEncoder.encode(newPassword));
    }

    /** Users with activity cannot be deleted (it would break ticket history) – deactivate them instead. */
    public void delete(Long id, UserPrincipal me) {
        if (Objects.equals(id, me.getId())) throw ApiException.badRequest("You cannot delete your own account");
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
        if (tickets.countByCreatedById(id) > 0 || tickets.countByAssignedToId(id) > 0
                || comments.countByAuthorId(id) > 0 || history.countByActorId(id) > 0) {
            throw ApiException.conflict("This user has ticket activity. Deactivate the account instead.");
        }
        users.delete(u);
    }
}
