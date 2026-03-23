package com.cv.SnapExpense.dto;

import java.math.BigDecimal;

public interface SpendingTrendRow {
    String getMonth();

    BigDecimal getTotalSpent();
}
