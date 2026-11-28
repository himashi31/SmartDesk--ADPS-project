package com.smartdesk.dto;

import com.smartdesk.model.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class CategoryDtos {
    private CategoryDtos() {}

    public record CategoryResponse(Long id, String name, String description) {
        public static CategoryResponse from(Category c) {
            return c == null ? null : new CategoryResponse(c.getId(), c.getName(), c.getDescription());
        }
    }

    public record CategoryRequest(
            @NotBlank(message = "Name is required") @Size(max = 60) String name,
            @Size(max = 255) String description) {}
}
