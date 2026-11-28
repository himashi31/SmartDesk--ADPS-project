package com.smartdesk.controller;

import com.smartdesk.dto.TicketDtos.*;
import com.smartdesk.model.TicketPriority;
import com.smartdesk.model.TicketStatus;
import com.smartdesk.security.CurrentUser;
import com.smartdesk.security.UserPrincipal;
import com.smartdesk.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    /** Create a ticket (any logged-in user). */
    @PostMapping
    public ResponseEntity<TicketResponse> create(@Valid @RequestBody CreateTicketRequest req, @CurrentUser UserPrincipal me) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.create(req, me));
    }

    /**
     * List / filter tickets.
     * scope = all | mine | assigned | unassigned   (normal users always get "mine")
     */
    @GetMapping
    public List<TicketResponse> list(@RequestParam(required = false) String scope,
                                     @RequestParam(required = false) TicketStatus status,
                                     @RequestParam(required = false) TicketPriority priority,
                                     @RequestParam(required = false) Long categoryId,
                                     @RequestParam(required = false) Long assignedToId,
                                     @RequestParam(required = false) String q,
                                     @CurrentUser UserPrincipal me) {
        return ticketService.search(scope, status, priority, categoryId, assignedToId, q, me);
    }

    /** Tickets created by the logged-in user. */
    @GetMapping("/my")
    public List<TicketResponse> mine(@CurrentUser UserPrincipal me) {
        return ticketService.search("mine", null, null, null, null, null, me);
    }

    /** Tickets assigned to the logged-in technician. */
    @GetMapping("/assigned")
    public List<TicketResponse> assigned(@CurrentUser UserPrincipal me) {
        return ticketService.search("assigned", null, null, null, null, null, me);
    }

    @GetMapping("/{id}")
    public TicketResponse get(@PathVariable Long id, @CurrentUser UserPrincipal me) {
        return ticketService.get(id, me);
    }

    @PutMapping("/{id}")
    public TicketResponse update(@PathVariable Long id, @Valid @RequestBody UpdateTicketRequest req, @CurrentUser UserPrincipal me) {
        return ticketService.update(id, req, me);
    }

    @PutMapping("/{id}/assign")
    public TicketResponse assign(@PathVariable Long id, @RequestBody AssignRequest req, @CurrentUser UserPrincipal me) {
        return ticketService.assign(id, req, me);
    }

    @PutMapping("/{id}/status")
    public TicketResponse status(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequest req, @CurrentUser UserPrincipal me) {
        return ticketService.updateStatus(id, req, me);
    }

    @PutMapping("/{id}/priority")
    public TicketResponse priority(@PathVariable Long id, @Valid @RequestBody PriorityUpdateRequest req, @CurrentUser UserPrincipal me) {
        return ticketService.updatePriority(id, req, me);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @CurrentUser UserPrincipal me) {
        ticketService.delete(id, me);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/comments")
    public List<CommentResponse> comments(@PathVariable Long id, @CurrentUser UserPrincipal me) {
        return ticketService.comments(id, me);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(@PathVariable Long id, @Valid @RequestBody CommentRequest req,
                                                      @CurrentUser UserPrincipal me) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.addComment(id, req, me));
    }

    @GetMapping("/{id}/history")
    public List<HistoryResponse> history(@PathVariable Long id, @CurrentUser UserPrincipal me) {
        return ticketService.history(id, me);
    }
}
