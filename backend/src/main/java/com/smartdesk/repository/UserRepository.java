package com.smartdesk.repository;

import com.smartdesk.model.Role;
import com.smartdesk.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<User> findByRoleAndActiveTrueOrderByFullNameAsc(Role role);
    List<User> findAllByOrderByCreatedAtDesc();
    long countByRole(Role role);
}
