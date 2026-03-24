package com.cv.SnapExpense.dto;

import lombok.Builder;
import lombok.Data;

import java.time.YearMonth;

@Data
@Builder
public class SetBudgetResponse {
    private YearMonth month;
    private Integer updated;
}
