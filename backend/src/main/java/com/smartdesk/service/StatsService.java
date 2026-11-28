package com.smartdesk.service;

import com.smartdesk.dto.StatsResponse;
import com.smartdesk.dto.StatsResponse.TechnicianWorkload;
import com.smartdesk.model.*;
import com.smartdesk.repository.CategoryRepository;
import com.smartdesk.repository.TicketRepository;
import com.smartdesk.repository.UserRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Resolution statistics and workload monitoring for the administrator dashboard. */
@Service
@Transactional(readOnly = true)
public class StatsService {

    private final TicketRepository tickets;
    private final UserRepository users;
    private final CategoryRepository categories;

    public StatsService(TicketRepository tickets, UserRepository users, CategoryRepository categories) {
        this.tickets = tickets;
        this.users = users;
        this.categories = categories;
    }

    public StatsResponse stats() {
        List<TicketStatus> finished = TicketService.finishedStatuses();

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (TicketStatus s : TicketStatus.values()) byStatus.put(s.name(), tickets.countByStatus(s));

        Map<String, Long> byPriority = new LinkedHashMap<>();
        for (TicketPriority p : TicketPriority.values()) {
            byPriority.put(p.name(), tickets.count((Specification<Ticket>) (root, q, cb) -> cb.equal(root.get("priority"), p)));
        }

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Category c : categories.findAllByOrderByNameAsc()) byCategory.put(c.getName(), tickets.countByCategoryId(c.getId()));
        long uncategorized = tickets.count((Specification<Ticket>) (root, q, cb) -> cb.isNull(root.get("category")));
        if (uncategorized > 0) byCategory.put("Uncategorized", uncategorized);

        List<Ticket> resolved = tickets.findByResolvedAtIsNotNull();
        Double avgHours = resolved.isEmpty() ? null : resolved.stream()
                .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toMinutes())
                .average().orElse(0) / 60.0;
        if (avgHours != null) avgHours = Math.round(avgHours * 10) / 10.0;

        List<TechnicianWorkload> workload = users.findByRoleAndActiveTrueOrderByFullNameAsc(Role.TECHNICIAN).stream()
                .map(u -> new TechnicianWorkload(u.getId(), u.getFullName(),
                        tickets.countByAssignedToIdAndStatusNotIn(u.getId(), finished),
                        tickets.countByAssignedToId(u.getId())))
                .toList();

        long total = tickets.count();
        long finishedCount = byStatus.get("RESOLVED") + byStatus.get("CLOSED");
        return new StatsResponse(total, total - finishedCount,
                tickets.countByAssignedToIsNullAndStatusNotIn(finished), finishedCount, avgHours,
                users.count(), users.countByRole(Role.TECHNICIAN),
                byStatus, byPriority, byCategory, workload);
    }
}
