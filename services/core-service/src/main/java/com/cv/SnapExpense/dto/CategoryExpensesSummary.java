package com.cv.SnapExpense.dto;

import com.cv.SnapExpense.model.Category;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.YearMonth;

@Builder
public class CategoryExpensesSummary {
    YearMonth month;
    Category category;
    BigDecimal totalSpend;
    BigDecimal totalBudget;
    BigDecimal remainingBudget;
    Integer receiptCount;
    BigDecimal percentUsed;
}
