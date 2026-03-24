package com.cv.SnapExpense.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.YearMonth;

@Data
@Builder
public class GetBudgetResponse {
    private Integer categoryId;
    private String categoryName;
    private YearMonth month;
    private BigDecimal budget;
}
