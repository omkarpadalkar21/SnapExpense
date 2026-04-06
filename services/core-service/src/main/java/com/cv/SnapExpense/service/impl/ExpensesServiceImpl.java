package com.cv.SnapExpense.service.impl;

import com.cv.SnapExpense.dto.*;
import com.cv.SnapExpense.model.Category;
import com.cv.SnapExpense.model.MonthlyBudget;
import com.cv.SnapExpense.model.User;
import com.cv.SnapExpense.repository.CategoryRepository;
import com.cv.SnapExpense.repository.MonthlyBudgetRepository;
import com.cv.SnapExpense.repository.ReceiptRepository;
import com.cv.SnapExpense.service.ExpensesService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class ExpensesServiceImpl implements ExpensesService {

    private final ReceiptRepository receiptRepository;
    private final MonthlyBudgetRepository monthlyBudgetRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public ExpensesSummary getExpenses(YearMonth month) {
        if (month == null) month = YearMonth.now();

        LocalDate from = month.atDay(1);
        LocalDate to = from.plusMonths(1);

        User user = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        List<Object[]> rows = receiptRepository.getMonthlySummary(user, from, to);
        Object[] row = rows.isEmpty() ? new Object[2] : rows.get(0);

        BigDecimal totalSpend = row[0] != null
                ? new BigDecimal(row[0].toString())
                : BigDecimal.ZERO;
        long receiptCount = row[1] != null
                ? ((Number) row[1]).longValue()
                : 0L;

        List<MonthlyBudget> budgets = monthlyBudgetRepository.findAllByUserAndMonth(user, month);
        BigDecimal totalBudget = budgets.stream()
                .map(MonthlyBudget::getBudget)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal percentUsed = totalBudget.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : totalSpend.divide(totalBudget, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        return ExpensesSummary.builder()
                .month(month)
                .totalSpent(totalSpend)
                .budget(totalBudget)
                .remaining(totalBudget.subtract(totalSpend))
                .receiptCount((int) receiptCount)
                .percentUsed(percentUsed)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryExpensesSummary> getExpensesByCategories(YearMonth month) {
        if (month == null) month = YearMonth.now();

        LocalDate from = month.atDay(1);
        LocalDate to = from.plusMonths(1);

        User user = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        List<CategoryBreakdown> rows = receiptRepository.getMonthlyCategoryBreakdown(user, from, to);
        Map<Integer, CategoryBreakdown> spentByCategory = rows.stream()
                .collect(Collectors.toMap(r -> r.getCategory().getId(), r -> r));

        List<MonthlyBudget> budgets = monthlyBudgetRepository.findAllByUserAndMonth(user, month);
        Map<Integer, MonthlyBudget> budgetByCategory = budgets.stream()
                .collect(Collectors.toMap(b -> b.getCategory().getId(), b -> b));

        List<com.cv.SnapExpense.model.Category> allCategories = categoryRepository.findAll();

        List<CategoryExpensesSummary> summaries = new ArrayList<>();

        for (com.cv.SnapExpense.model.Category category : allCategories) {
            CategoryBreakdown spentRow = spentByCategory.get(category.getId());
            MonthlyBudget budgetRow = budgetByCategory.get(category.getId());

            BigDecimal spent = spentRow != null && spentRow.getSpent() != null ? spentRow.getSpent() : BigDecimal.ZERO;
            long count = spentRow != null && spentRow.getReceiptCount() != null ? spentRow.getReceiptCount() : 0L;
            BigDecimal budget = budgetRow != null && budgetRow.getBudget() != null ? budgetRow.getBudget() : BigDecimal.ZERO;

            if (spent.compareTo(BigDecimal.ZERO) == 0 && budget.compareTo(BigDecimal.ZERO) == 0) {
                continue; // Skip if no activity and no budget
            }

            BigDecimal percentUsed = budget.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : spent.divide(budget, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            summaries.add(
                    CategoryExpensesSummary.builder()
                            .month(month)
                            .category(category.getName())
                            .icon(category.getIcon())
                            .color(category.getColor())
                            .spent(spent)
                            .budget(budget)
                            .remaining(budget.subtract(spent))
                            .receiptCount((int) count)
                            .percentUsed(percentUsed)
                            .build()
            );
        }

        summaries.sort((a, b) -> b.getSpent().compareTo(a.getSpent())); // Order by spend descending
        return summaries;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SpendingTrendDTO> getSpendingTrend(Integer months) {
        if (months == null || months < 1) months = 6;
        if (months > 12) months = 12;

        User user = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        LocalDate from = LocalDate.now()
                .minusMonths(months - 1)
                .withDayOfMonth(1);

        List<SpendingTrendRow> rows = receiptRepository
                .getSpendingTrend(user.getId(), from);

        // Index results by month string for zero-fill lookup
        Map<String, BigDecimal> spentByMonth = rows.stream()
                .collect(Collectors.toMap(
                        SpendingTrendRow::getMonth,
                        SpendingTrendRow::getTotalSpent
                ));

        // Generate all months in range, zero-filling missing ones
        String currentMonth = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        return IntStream.range(0, months)
                .mapToObj(i -> from.plusMonths(i)
                        .format(DateTimeFormatter.ofPattern("yyyy-MM")))
                .map(m -> new SpendingTrendDTO(
                        m,
                        spentByMonth.getOrDefault(m, BigDecimal.ZERO),
                        m.equals(currentMonth)
                ))
                .toList();
    }
}
