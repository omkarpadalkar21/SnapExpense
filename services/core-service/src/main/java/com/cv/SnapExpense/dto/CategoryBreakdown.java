package com.cv.SnapExpense.dto;

import com.cv.SnapExpense.model.Category;

import java.math.BigDecimal;

public interface CategoryBreakdown {
    Category getCategory();
    BigDecimal getSpent();
    Long getReceiptCount();
    BigDecimal getBudget();
}