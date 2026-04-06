package com.cv.SnapExpense.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class SpendingTrendDTO {
    private String month;
    private BigDecimal amount;    // was totalSpent — matches frontend SpendingTrend.amount
    private boolean isCurrent;   // matches frontend SpendingTrend.isCurrent
}
