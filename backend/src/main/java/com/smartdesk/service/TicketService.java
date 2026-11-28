package com.smartdesk.service;

import com.smartdesk.dto.TicketDtos.*;
import com.smartdesk.exception.ApiException;
import com.smartdesk.model.*;
import com.smartdesk.repository.*;
import com.smartdesk.security.UserPrincipal;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Ticket workflow: REPORT -> TRIAGE -> ASSIGN -> RESOLVE -> CLOSE.
 *
 * Access rules
 *  - USER:        creates tickets, sees ONLY own tickets, comments on own tickets (public only),
 *                 may edit own ticket while OPEN and unassigned, may close or re-open own ticket once RESOLVED.
 *  - TECHNICIAN:  sees all tickets (assigned + unassigned queue), can take an unassigned ticket,
 *                 changes status/priority of tickets assigned to them, adds public or internal comments.
 *  - ADMIN:       everything, including assigning tickets to any technician and deleting tickets.
 */
@Service
@Transactional
public class TicketService {

    private static final List<TicketStatus> FINISHED = List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED);

    private final TicketRepository tickets;
    private final UserRepository users;
    private final CategoryRepository categories;
    private final CommentRepository comments;
    private final TicketHistoryRepository history;

    public TicketService(TicketRepository tickets, UserRepository users, CategoryRepository categories,
                         CommentRepository comments, TicketHistoryRepository history) {
        this.tickets = tickets;
        this.users = users;
        this.categories = categories;
        this.comments = comments;
        this.history = history;
    }

    // ------------------------------------------------------------------ create / read

    public TicketResponse create(CreateTicketRequest req, UserPrincipal me) {
        User creator = loadUser(me.getId());
        Ticket t = new Ticket();
        t.setTitle(req.title().trim());
        t.setDescription(req.description().trim());
        t.setPriority(req.priority() != null ? req.priority() : TicketPriority.MEDIUM);
        t.setCategory(req.categoryId() != null ? loadCategory(req.categoryId()) : null);
        t.setCreatedBy(creator);
        t.setStatus(TicketStatus.OPEN);
        tickets.save(t);
        log(t, creator, "CREATED", "Ticket created");
        return TicketResponse.from(t);
    }

    /**
     * @param scope "mine" (created by me), "assigned" (assigned to me), "unassigned", or "all" (staff only).
     *              Normal users are always limited to their own tickets.
     */
    @Transactional(readOnly = true)
    public List<TicketResponse> search(String scope, TicketStatus status, TicketPriority priority, Long categoryId,
                                       Long assignedToId, String q, UserPrincipal me) {
        String effectiveScope = me.isStaff() ? (scope == null ? "all" : scope) : "mine";

        Specification<Ticket> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            switch (effectiveScope) {
                case "mine" -> p.add(cb.equal(root.get("createdBy").get("id"), me.getId()));
                case "assigned" -> p.add(cb.equal(root.get("assignedTo").get("id"), me.getId()));
                case "unassigned" -> p.add(cb.isNull(root.get("assignedTo")));
                case "all" -> { }
                default -> throw ApiException.badRequest("Unknown scope: " + effectiveScope);
            }
            if (status != null) p.add(cb.equal(root.get("status"), status));
            if (priority != null) p.add(cb.equal(root.get("priority"), priority));
            if (categoryId != null) p.add(cb.equal(root.get("category").get("id"), categoryId));
            if (assignedToId != null && me.isStaff()) p.add(cb.equal(root.get("assignedTo").get("id"), assignedToId));
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                p.add(cb.or(cb.like(cb.lower(root.get("title")), like),
                            cb.like(cb.lower(root.get("description")), like)));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
        return tickets.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(TicketResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public TicketResponse get(Long id, UserPrincipal me) {
        return TicketResponse.from(loadVisible(id, me));
    }

    // ------------------------------------------------------------------ update

    public TicketResponse update(Long id, UpdateTicketRequest req, UserPrincipal me) {
        Ticket t = loadVisible(id, me);
        if (!me.isStaff()) {
            if (t.getStatus() != TicketStatus.OPEN || t.getAssignedTo() != null) {
                throw ApiException.forbidden("You can only edit your ticket before it is assigned");
            }
        } else if (me.isTechnician() && !isAssignee(t, me)) {
            throw ApiException.forbidden("Only the assigned technician or an administrator can edit this ticket");
        }
        if (req.title() != null && !req.title().isBlank()) t.setTitle(req.title().trim());
        if (req.description() != null && !req.description().isBlank()) t.setDescription(req.description().trim());
        if (req.categoryId() != null) t.setCategory(loadCategory(req.categoryId()));
        log(t, loadUser(me.getId()), "UPDATED", "Ticket details updated");
        return TicketResponse.from(t);
    }

    public TicketResponse assign(Long id, AssignRequest req, UserPrincipal me) {
        Ticket t = loadTicket(id);
        User actor = loadUser(me.getId());
        Long targetId = req.technicianId();

        if (me.isTechnician()) {
            // a technician may only "take" an unassigned ticket for themselves
            if (!Objects.equals(targetId, me.getId())) {
                throw ApiException.forbidden("Technicians can only assign tickets to themselves");
            }
            if (t.getAssignedTo() != null && !isAssignee(t, me)) {
                throw ApiException.forbidden("This ticket is already assigned to another technician");
            }
        } else if (!me.isAdmin()) {
            throw ApiException.forbidden("Only technicians and administrators can assign tickets");
        }

        if (targetId == null) {
            t.setAssignedTo(null);
            log(t, actor, "UNASSIGNED", "Ticket unassigned");
        } else {
            User tech = loadUser(targetId);
            if (tech.getRole() == Role.USER) throw ApiException.badRequest("Tickets can only be assigned to technicians or administrators");
            if (!tech.isActive()) throw ApiException.badRequest("Cannot assign to a deactivated account");
            t.setAssignedTo(tech);
            log(t, actor, "ASSIGNED", "Assigned to " + tech.getFullName());
        }
        return TicketResponse.from(t);
    }

    public TicketResponse updateStatus(Long id, StatusUpdateRequest req, UserPrincipal me) {
        Ticket t = loadVisible(id, me);
        TicketStatus from = t.getStatus();
        TicketStatus to = req.status();
        if (from == to) return TicketResponse.from(t);

        if (!me.isStaff()) {
            // owner may confirm (close) or re-open a resolved ticket
            boolean close = from == TicketStatus.RESOLVED && to == TicketStatus.CLOSED;
            boolean reopen = from.isFinished() && to == TicketStatus.OPEN;
            if (!close && !reopen) {
                throw ApiException.forbidden("You can only close or re-open your ticket after it has been resolved");
            }
        } else if (me.isTechnician() && !isAssignee(t, me)) {
            throw ApiException.forbidden("Only the assigned technician can change the status of this ticket");
        }

        if (to == TicketStatus.RESOLVED) {
            String resolution = req.resolution() == null ? null : req.resolution().trim();
            if ((resolution == null || resolution.isEmpty()) && (t.getResolution() == null || t.getResolution().isBlank())) {
                throw ApiException.badRequest("Please describe the resolution before marking the ticket as resolved");
            }
            if (resolution != null && !resolution.isEmpty()) t.setResolution(resolution);
        }
        if (to.isFinished()) {
            if (t.getResolvedAt() == null) t.setResolvedAt(LocalDateTime.now());
        } else {
            t.setResolvedAt(null);
        }
        t.setStatus(to);
        log(t, loadUser(me.getId()), "STATUS_CHANGED", from + " -> " + to);
        return TicketResponse.from(t);
    }

    public TicketResponse updatePriority(Long id, PriorityUpdateRequest req, UserPrincipal me) {
        Ticket t = loadTicket(id);
        if (!me.isStaff()) throw ApiException.forbidden("Only IT staff can change the priority");
        if (me.isTechnician() && t.getAssignedTo() != null && !isAssignee(t, me)) {
            throw ApiException.forbidden("This ticket is assigned to another technician");
        }
        TicketPriority from = t.getPriority();
        if (from != req.priority()) {
            t.setPriority(req.priority());
            log(t, loadUser(me.getId()), "PRIORITY_CHANGED", from + " -> " + req.priority());
        }
        return TicketResponse.from(t);
    }

    public void delete(Long id, UserPrincipal me) {
        if (!me.isAdmin()) throw ApiException.forbidden("Only administrators can delete tickets");
        Ticket t = loadTicket(id);
        comments.deleteAll(comments.findByTicketIdOrderByCreatedAtAsc(id));
        history.deleteAll(history.findByTicketIdOrderByCreatedAtAsc(id));
        tickets.delete(t);
    }

    // ------------------------------------------------------------------ comments & history

    @Transactional(readOnly = true)
    public List<CommentResponse> comments(Long ticketId, UserPrincipal me) {
        loadVisible(ticketId, me);
        List<Comment> list = me.isStaff()
                ? comments.findByTicketIdOrderByCreatedAtAsc(ticketId)
                : comments.findByTicketIdAndInternalFalseOrderByCreatedAtAsc(ticketId);
        return list.stream().map(CommentResponse::from).toList();
    }

    public CommentResponse addComment(Long ticketId, CommentRequest req, UserPrincipal me) {
        Ticket t = loadVisible(ticketId, me);
        if (t.getStatus() == TicketStatus.CLOSED) throw ApiException.badRequest("Closed tickets cannot receive new comments");
        boolean internal = req.internal() && me.isStaff();   // normal users can never write internal notes
        Comment c = comments.save(new Comment(t, loadUser(me.getId()), req.body().trim(), internal));
        return CommentResponse.from(c);
    }

    @Transactional(readOnly = true)
    public List<HistoryResponse> history(Long ticketId, UserPrincipal me) {
        loadVisible(ticketId, me);
        return history.findByTicketIdOrderByCreatedAtAsc(ticketId).stream().map(HistoryResponse::from).toList();
    }

    // ------------------------------------------------------------------ helpers

    /** Loads a ticket and checks that the current user may see it (users: only their own). */
    private Ticket loadVisible(Long id, UserPrincipal me) {
        Ticket t = loadTicket(id);
        if (!me.isStaff() && !Objects.equals(t.getCreatedBy().getId(), me.getId())) {
            // respond 404 instead of 403 so users cannot discover other users' ticket ids
            throw ApiException.notFound("Ticket");
        }
        return t;
    }

    private boolean isAssignee(Ticket t, UserPrincipal me) {
        return t.getAssignedTo() != null && Objects.equals(t.getAssignedTo().getId(), me.getId());
    }

    private Ticket loadTicket(Long id) {
        return tickets.findById(id).orElseThrow(() -> ApiException.notFound("Ticket"));
    }

    private User loadUser(Long id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
    }

    private Category loadCategory(Long id) {
        return categories.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
    }

    private void log(Ticket t, User actor, String action, String details) {
        history.save(new TicketHistory(t, actor, action, details));
    }

    static List<TicketStatus> finishedStatuses() { return FINISHED; }
}
