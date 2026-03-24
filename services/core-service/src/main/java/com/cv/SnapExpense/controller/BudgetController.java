package com.cv.SnapExpense.controller;

import com.cv.SnapExpense.dto.GetBudgetResponse;
import com.cv.SnapExpense.dto.SetBudgetRequest;
import com.cv.SnapExpense.dto.SetBudgetResponse;
import com.cv.SnapExpense.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;

@RequestMapping("/api/budgets")
@RestController
@RequiredArgsConstructor
public class BudgetController {
    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<GetBudgetResponse>> getBudgetByMonth(@RequestParam(required = false) YearMonth month) {
        if (month == null) {
            month = YearMonth.now();
        }
        return ResponseEntity.ok().body(budgetService.getBudgetByMonth(month));
    }

    @PutMapping
    public ResponseEntity<SetBudgetResponse> setBudgetByMonth(@RequestBody SetBudgetRequest setBudgetRequest) {
        return ResponseEntity.ok().body(budgetService.setBudgetByMonth(setBudgetRequest));
    }
}

