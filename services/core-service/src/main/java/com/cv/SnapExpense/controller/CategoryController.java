package com.cv.SnapExpense.controller;

import com.cv.SnapExpense.dto.receipt.CategoryResponse;
import com.cv.SnapExpense.model.Category;
import com.cv.SnapExpense.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        List<CategoryResponse> categories = categoryRepository.findAll().stream()
                .map(cat -> CategoryResponse.builder()
                        .id(cat.getId())
                        .name(cat.getName())
                        .icon(cat.getIcon())
                        .color(cat.getColor())
                        .build())
                .toList();
        return ResponseEntity.ok(categories);
    }
}
