package com.cv.SnapExpense.service.impl;

import com.cv.SnapExpense.dto.CategoryExpensesSummary;
import com.cv.SnapExpense.dto.ExpensesSummary;
import com.cv.SnapExpense.dto.SpendingTrendRow;
import com.cv.SnapExpense.model.Category;
import com.cv.SnapExpense.model.User;
import com.cv.SnapExpense.repository.ReceiptRepository;
import com.cv.SnapExpense.service.ExpensesService;
import com.cv.SnapExpense.dto.SpendingTrendDTO;
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

    @Override
    @Transactional(readOnly = true)
    public ExpensesSummary getExpenses(YearMonth month) {
        if (month == null) month = YearMonth.now();

        LocalDate from = month.atDay(1);
        LocalDate to = from.plusMonths(1);

        User user = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        Object[] row = receiptRepository.getMonthlySummary(user, from, to);

        BigDecimal totalSpend = row[0] != null ? (BigDecimal) row[0] : BigDecimal.ZERO;
        BigDecimal totalBudget = (BigDecimal) row[2];
        long receiptCount = (Long) row[1];

        BigDecimal percentUsed = totalBudget.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : totalSpend.divide(totalBudget, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        return ExpensesSummary.builder()
                .month(month)
                .totalSpend(totalSpend)
                .totalBudget(totalBudget)
                .remainingBudget(totalBudget.subtract(totalSpend))
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

        List<Object[]> rows = receiptRepository.getMonthlyCategoryBreakdown(user, from, to);

        if (rows.isEmpty()) return List.of();

        List<CategoryExpensesSummary> summaries = new ArrayList<>();

        for (Object[] row : rows) {
            // Each row: [Category, spent, receiptCount, budget]
            Category category = (Category) row[0];
            BigDecimal spent = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            long receiptCount = (Long) row[2];
            BigDecimal budget = (BigDecimal) row[3];

            BigDecimal percentUsed = budget.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : spent.divide(budget, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            summaries.add(
                    CategoryExpensesSummary.builder()
                            .month(month)
                            .category(category)
                            .totalSpend(spent)
                            .totalBudget(budget)
                            .remainingBudget(budget.subtract(spent))
                            .receiptCount((int) receiptCount)
                            .percentUsed(percentUsed)
                            .build()
            );
        }

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
        return IntStream.range(0, months)
                .mapToObj(i -> from.plusMonths(i)
                        .format(DateTimeFormatter.ofPattern("yyyy-MM")))
                .map(m -> new SpendingTrendDTO(
                        m,
                        spentByMonth.getOrDefault(m, BigDecimal.ZERO)
                ))
                .toList();
    }
}
