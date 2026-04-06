package com.cv.SnapExpense.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.YearMonth;

@Data
@Builder
public class ExpensesSummary {
    YearMonth month;
    BigDecimal totalSpent;    // was totalSpend — matches frontend MonthlySummary.totalSpent
    BigDecimal budget;         // was totalBudget — matches frontend MonthlySummary.budget
    BigDecimal remaining;      // was remainingBudget — matches frontend MonthlySummary.remaining
    Integer receiptCount;
    BigDecimal percentUsed;
}
