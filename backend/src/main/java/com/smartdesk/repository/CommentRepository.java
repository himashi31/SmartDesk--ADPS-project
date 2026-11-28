package com.smartdesk.repository;

import com.smartdesk.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
    List<Comment> findByTicketIdAndInternalFalseOrderByCreatedAtAsc(Long ticketId);
    long countByAuthorId(Long userId);
}
