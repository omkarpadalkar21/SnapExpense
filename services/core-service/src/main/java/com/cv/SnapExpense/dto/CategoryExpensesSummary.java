package com.cv.SnapExpense.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.YearMonth;

@Data
@Builder
public class CategoryExpensesSummary {
    YearMonth month;
    String category;      // category name — matches frontend CategorySummary.category
    String icon;          // pulled from Category.icon — matches frontend CategorySummary.icon
    String color;         // pulled from Category.color — matches frontend CategorySummary.color
    BigDecimal spent;     // was totalSpend — matches frontend CategorySummary.spent
    BigDecimal budget;    // was totalBudget — matches frontend CategorySummary.budget
    BigDecimal remaining; // was remainingBudget — matches frontend CategorySummary.remaining
    Integer receiptCount;
    BigDecimal percentUsed;
}
