package com.cv.SnapExpense.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

@Data
public class SetBudgetRequest {
    private YearMonth month;
    private List<BudgetEntry> budgets;

    @Data
    public static class BudgetEntry {
        private Integer categoryId;
        private BigDecimal budget;
    }
}
