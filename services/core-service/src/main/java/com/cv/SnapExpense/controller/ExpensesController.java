package com.cv.SnapExpense.controller;

import com.cv.SnapExpense.dto.CategoryExpensesSummary;
import com.cv.SnapExpense.dto.ExpensesSummary;
import com.cv.SnapExpense.service.ExpensesService;
import com.cv.SnapExpense.dto.SpendingTrendDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpensesController {
    private final ExpensesService expensesService;

    @GetMapping("/summary")
    public ResponseEntity<ExpensesSummary> getExpenses(@RequestParam(required = false) YearMonth month) {
        if (month == null) {
            month = YearMonth.now();
        }
        return ResponseEntity.ok().body(expensesService.getExpenses(month));
    }

    @GetMapping("/summary/categories")
    public ResponseEntity<List<CategoryExpensesSummary>> getExpensesByCategories(@RequestParam(required = false) YearMonth month) {
        if (month == null) {
            month = YearMonth.now();
        }
        return ResponseEntity.ok().body(expensesService.getExpensesByCategories(month));
    }

    @GetMapping("/trend")
    public ResponseEntity<List<SpendingTrendDTO>> getSpendingTrend(@RequestParam(required = false, defaultValue = "6") Integer months) {
        if (months > 12) {
            months = 12;
        }
        return ResponseEntity.ok().body(expensesService.getSpendingTrend(months));
    }

}
