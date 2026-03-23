package com.cv.SnapExpense.service;

import com.cv.SnapExpense.dto.CategoryExpensesSummary;
import com.cv.SnapExpense.dto.ExpensesSummary;
import com.cv.SnapExpense.service.dto.SpendingTrendDTO;

import java.time.YearMonth;
import java.util.List;

public interface ExpensesService {
    ExpensesSummary getExpenses(YearMonth yearMonth);

    List<CategoryExpensesSummary> getExpensesByCategories(YearMonth yearMonth);

    List<SpendingTrendDTO> getSpendingTrend(Integer months);
}
