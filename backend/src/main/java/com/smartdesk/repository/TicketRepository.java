package com.smartdesk.repository;

import com.smartdesk.model.Ticket;
import com.smartdesk.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {
    long countByStatus(TicketStatus status);
    long countByAssignedToIsNullAndStatusNotIn(List<TicketStatus> statuses);
    long countByCategoryId(Long categoryId);
    long countByCreatedById(Long userId);
    long countByAssignedToId(Long userId);
    long countByAssignedToIdAndStatusNotIn(Long userId, List<TicketStatus> statuses);
    List<Ticket> findByResolvedAtIsNotNull();
}
