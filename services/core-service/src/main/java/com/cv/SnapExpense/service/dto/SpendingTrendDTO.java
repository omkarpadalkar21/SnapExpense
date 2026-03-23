package com.cv.SnapExpense.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class SpendingTrendDTO {
    private String month;
    private BigDecimal totalSpent;
}
