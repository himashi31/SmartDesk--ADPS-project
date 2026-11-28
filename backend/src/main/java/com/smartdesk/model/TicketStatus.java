package com.smartdesk.model;

public enum TicketStatus {
    OPEN, IN_PROGRESS, ON_HOLD, RESOLVED, CLOSED;

    public boolean isFinished() {
        return this == RESOLVED || this == CLOSED;
    }
}
