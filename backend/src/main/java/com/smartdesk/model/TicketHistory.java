package com.smartdesk.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Audit trail entry: who changed what on a ticket and when. */
@Entity
@Table(name = "ticket_history")
public class TicketHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Column(nullable = false, length = 40)
    private String action;

    @Column(length = 255)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public TicketHistory() {}

    public TicketHistory(Ticket ticket, User actor, String action, String details) {
        this.ticket = ticket;
        this.actor = actor;
        this.action = action;
        this.details = details != null && details.length() > 255 ? details.substring(0, 255) : details;
    }

    public Long getId() { return id; }
    public Ticket getTicket() { return ticket; }
    public User getActor() { return actor; }
    public String getAction() { return action; }
    public String getDetails() { return details; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
