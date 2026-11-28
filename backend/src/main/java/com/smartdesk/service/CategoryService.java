package com.smartdesk.service;

import com.smartdesk.dto.CategoryDtos.*;
import com.smartdesk.exception.ApiException;
import com.smartdesk.model.Category;
import com.smartdesk.repository.CategoryRepository;
import com.smartdesk.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categories;
    private final TicketRepository tickets;

    public CategoryService(CategoryRepository categories, TicketRepository tickets) {
        this.categories = categories;
        this.tickets = tickets;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list() {
        return categories.findAllByOrderByNameAsc().stream().map(CategoryResponse::from).toList();
    }

    public CategoryResponse create(CategoryRequest req) {
        if (categories.existsByNameIgnoreCase(req.name().trim())) {
            throw ApiException.conflict("A category with this name already exists");
        }
        return CategoryResponse.from(categories.save(new Category(req.name().trim(), AuthService.blankToNull(req.description()))));
    }

    public CategoryResponse update(Long id, CategoryRequest req) {
        Category c = categories.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
        String name = req.name().trim();
        if (!c.getName().equalsIgnoreCase(name) && categories.existsByNameIgnoreCase(name)) {
            throw ApiException.conflict("A category with this name already exists");
        }
        c.setName(name);
        c.setDescription(AuthService.blankToNull(req.description()));
        return CategoryResponse.from(c);
    }

    public void delete(Long id) {
        Category c = categories.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
        long used = tickets.countByCategoryId(id);
        if (used > 0) {
            throw ApiException.conflict("Category is used by " + used + " ticket(s) and cannot be deleted");
        }
        categories.delete(c);
    }
}
