package com.cv.SnapExpense.dto.receipt;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponse {
    private Integer id;
    private String name;
}
