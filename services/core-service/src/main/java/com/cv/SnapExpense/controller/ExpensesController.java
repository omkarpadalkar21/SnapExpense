package com.cv.SnapExpense.controller;

import com.cv.SnapExpense.dto.CategoryExpensesSummary;
import com.cv.SnapExpense.dto.ExpensesSummary;
import com.cv.SnapExpense.service.ExpensesService;
import com.cv.SnapExpense.service.dto.SpendingTrendDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpensesController {
    private final ExpensesService expensesService;

    @GetMapping("/summary")
    public ResponseEntity<ExpensesSummary> getExpenses(@RequestBody YearMonth yearMonth){
        return ResponseEntity.ok().body(expensesService.getExpenses(yearMonth));
    }

    @GetMapping("/summary/categories")
    public ResponseEntity<List<CategoryExpensesSummary>> getExpensesByCategories(@RequestBody YearMonth yearMonth){
        return ResponseEntity.ok().body(expensesService.getExpensesByCategories(yearMonth));
    }
    @GetMapping("/trend")
    public ResponseEntity<List<SpendingTrendDTO>> getSpendingTrend(@RequestBody Integer months){
        return ResponseEntity.ok().body(expensesService.getSpendingTrend(months));
    }

}
