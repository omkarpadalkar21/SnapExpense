package com.cv.SnapExpense.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class SpendingTrendDTO {
    private String month;
    private BigDecimal amount;    // was totalSpent — matches frontend SpendingTrend.amount
    @JsonProperty("isCurrent")   // Prevent Jackson stripping 'is' prefix → serializes as 'current'
    private boolean isCurrent;   // matches frontend SpendingTrend.isCurrent
}
