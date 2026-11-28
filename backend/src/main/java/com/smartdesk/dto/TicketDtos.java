package com.smartdesk.dto;

import com.smartdesk.model.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class TicketDtos {
    private TicketDtos() {}

    public record CreateTicketRequest(
            @NotBlank(message = "Title is required") @Size(min = 5, max = 150, message = "Title must be 5–150 characters") String title,
            @NotBlank(message = "Description is required") @Size(min = 10, max = 4000, message = "Description must be 10–4000 characters") String description,
            TicketPriority priority,
            Long categoryId) {}

    public record UpdateTicketRequest(
            @Size(min = 5, max = 150) String title,
            @Size(min = 10, max = 4000) String description,
            Long categoryId) {}

    /** technicianId = null means "unassign". */
    public record AssignRequest(Long technicianId) {}

    public record StatusUpdateRequest(
            @NotNull(message = "Status is required") TicketStatus status,
            @Size(max = 4000) String resolution) {}

    public record PriorityUpdateRequest(@NotNull(message = "Priority is required") TicketPriority priority) {}

    public record TicketResponse(
            Long id, String title, String description, TicketStatus status, TicketPriority priority,
            CategoryDtos.CategoryResponse category, UserDtos.UserSummary createdBy, UserDtos.UserSummary assignedTo,
            String resolution, LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime resolvedAt) {

        public static TicketResponse from(Ticket t) {
            return new TicketResponse(t.getId(), t.getTitle(), t.getDescription(), t.getStatus(), t.getPriority(),
                    CategoryDtos.CategoryResponse.from(t.getCategory()),
                    UserDtos.UserSummary.from(t.getCreatedBy()),
                    UserDtos.UserSummary.from(t.getAssignedTo()),
                    t.getResolution(), t.getCreatedAt(), t.getUpdatedAt(), t.getResolvedAt());
        }
    }

    public record CommentRequest(
            @NotBlank(message = "Comment cannot be empty") @Size(max = 4000) String body,
            boolean internal) {}

    public record CommentResponse(Long id, UserDtos.UserSummary author, String body, boolean internal,
                                  LocalDateTime createdAt) {
        public static CommentResponse from(Comment c) {
            return new CommentResponse(c.getId(), UserDtos.UserSummary.from(c.getAuthor()), c.getBody(),
                    c.isInternal(), c.getCreatedAt());
        }
    }

    public record HistoryResponse(Long id, UserDtos.UserSummary actor, String action, String details,
                                  LocalDateTime createdAt) {
        public static HistoryResponse from(TicketHistory h) {
            return new HistoryResponse(h.getId(), UserDtos.UserSummary.from(h.getActor()), h.getAction(),
                    h.getDetails(), h.getCreatedAt());
        }
    }
}
