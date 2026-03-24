package com.cv.SnapExpense.service.impl;

import com.cv.SnapExpense.dto.GetBudgetResponse;
import com.cv.SnapExpense.dto.SetBudgetRequest;
import com.cv.SnapExpense.dto.SetBudgetResponse;
import com.cv.SnapExpense.mapper.BudgetMapper;
import com.cv.SnapExpense.model.MonthlyBudget;
import com.cv.SnapExpense.model.User;
import com.cv.SnapExpense.repository.CategoryRepository;
import com.cv.SnapExpense.repository.MonthlyBudgetRepository;
import com.cv.SnapExpense.service.BudgetService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetServiceImpl implements BudgetService {
    private final MonthlyBudgetRepository monthlyBudgetRepository;
    private final BudgetMapper budgetMapper;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<GetBudgetResponse> getBudgetByMonth(YearMonth month) {
        if (month == null) month = YearMonth.now();
        User user = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        List<MonthlyBudget> budgets = monthlyBudgetRepository.findAllByUserAndMonth(user, month);

        return budgets.stream()
                .map(budgetMapper::toGetBudgetResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SetBudgetResponse setBudgetByMonth(SetBudgetRequest setBudgetRequest) {
        if (setBudgetRequest.getMonth() == null) setBudgetRequest.setMonth(YearMonth.now());

        User user = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        List<MonthlyBudget> existingBudgets = monthlyBudgetRepository.findAllByUserAndMonth(user, setBudgetRequest.getMonth());
        List<MonthlyBudget> monthlyBudgetsToSave = new ArrayList<>();

        for (SetBudgetRequest.BudgetEntry budget : setBudgetRequest.getBudgets()) {
            MonthlyBudget existing = existingBudgets.stream()
                    .filter(b -> b.getCategory().getId().equals(budget.getCategoryId()))
                    .findFirst()
                    .orElse(null);

            if (existing != null) {
                existing.setBudget(budget.getBudget());
                monthlyBudgetsToSave.add(existing);
            } else {
                monthlyBudgetsToSave.add(MonthlyBudget.builder()
                        .user(user)
                        .category(
                                categoryRepository
                                        .findById(budget.getCategoryId())
                                        .orElseThrow(() -> new EntityNotFoundException("Category not found")))
                        .month(setBudgetRequest.getMonth())
                        .budget(budget.getBudget())
                        .build()
                );
            }
        }

        monthlyBudgetRepository.saveAll(monthlyBudgetsToSave);
        return SetBudgetResponse.builder()
                .month(setBudgetRequest.getMonth())
                .updated(monthlyBudgetsToSave.size())
                .build();
    }
}
