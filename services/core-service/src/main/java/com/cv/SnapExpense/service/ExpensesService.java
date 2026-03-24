package com.cv.SnapExpense.service;

import com.cv.SnapExpense.dto.CategoryExpensesSummary;
import com.cv.SnapExpense.dto.ExpensesSummary;
import com.cv.SnapExpense.dto.SpendingTrendDTO;

import java.time.YearMonth;
import java.util.List;

public interface ExpensesService {
    ExpensesSummary getExpenses(YearMonth month);

    List<CategoryExpensesSummary> getExpensesByCategories(YearMonth month);

    List<SpendingTrendDTO> getSpendingTrend(Integer months);
}
