package com.smartdesk.dto;

import java.util.List;
import java.util.Map;

public record StatsResponse(
        long totalTickets,
        long openTickets,
        long unassignedTickets,
        long resolvedTickets,
        Double averageResolutionHours,
        long totalUsers,
        long totalTechnicians,
        Map<String, Long> byStatus,
        Map<String, Long> byPriority,
        Map<String, Long> byCategory,
        List<TechnicianWorkload> technicianWorkload) {

    public record TechnicianWorkload(Long technicianId, String fullName, long activeTickets, long totalAssigned) {}
}
