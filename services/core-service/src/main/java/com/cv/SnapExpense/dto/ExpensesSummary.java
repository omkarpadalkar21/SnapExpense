package com.cv.SnapExpense.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.YearMonth;

@Data
@Builder
public class ExpensesSummary {
    YearMonth month;
    BigDecimal totalSpend;
    BigDecimal totalBudget;
    BigDecimal remainingBudget;
    Integer receiptCount;
    BigDecimal percentUsed;
}
