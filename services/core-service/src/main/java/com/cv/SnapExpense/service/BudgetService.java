package com.cv.SnapExpense.service;

import com.cv.SnapExpense.dto.GetBudgetResponse;
import com.cv.SnapExpense.dto.SetBudgetRequest;
import com.cv.SnapExpense.dto.SetBudgetResponse;

import java.time.YearMonth;
import java.util.List;

public interface BudgetService {
    List<GetBudgetResponse> getBudgetByMonth(YearMonth month);

     SetBudgetResponse setBudgetByMonth(SetBudgetRequest setBudgetRequest);
}
