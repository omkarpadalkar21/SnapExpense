package com.cv.SnapExpense.repository;

import com.cv.SnapExpense.dto.CategoryBreakdown;
import com.cv.SnapExpense.dto.SpendingTrendRow;
import com.cv.SnapExpense.model.Receipt;
import com.cv.SnapExpense.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

public interface ReceiptRepository extends JpaRepository<Receipt, UUID> {

    @Query("""
    SELECT SUM(r.totalAmount), COUNT(r),
           COALESCE(SUM(mb.budget), 0.0)
    FROM Receipt r
    LEFT JOIN MonthlyBudget mb
        ON mb.user = r.user
        AND mb.month = :month
    WHERE r.user = :user
        AND r.receiptDate >= :monthStart
        AND r.receiptDate < :monthEnd
""")
    Object[] getMonthlySummary(
            @Param("user") User user,
            @Param("month") YearMonth month,
            @Param("monthStart") LocalDate monthStart,
            @Param("monthEnd") LocalDate monthEnd
    );

    @Query("""
    SELECT r.category           AS category,
           SUM(r.totalAmount)   AS spent,
           COUNT(r)             AS receiptCount,
           COALESCE(mb.budget, 0) AS budget
    FROM Receipt r
    LEFT JOIN MonthlyBudget mb
        ON mb.user = r.user
        AND mb.category = r.category
        AND mb.month = :month
    WHERE r.user = :user
        AND r.receiptDate >= :monthStart
        AND r.receiptDate < :monthEnd
    GROUP BY r.category, mb.budget
    ORDER BY SUM(r.totalAmount) DESC
""")
    List<CategoryBreakdown> getMonthlyCategoryBreakdown(
            @Param("user") User user,
            @Param("month") YearMonth month,
            @Param("monthStart") LocalDate monthStart,
            @Param("monthEnd") LocalDate monthEnd
    );

    @Query(value = """
        SELECT TO_CHAR(r.receipt_date, 'YYYY-MM') AS month,
               COALESCE(SUM(r.total_amount), 0)   AS total_spent
        FROM receipts r
        WHERE r.user_id = :userId
            AND r.receipt_date >= :from
        GROUP BY TO_CHAR(r.receipt_date, 'YYYY-MM')
        ORDER BY month ASC
        """, nativeQuery = true)
    List<SpendingTrendRow> getSpendingTrend(
            @Param("userId") UUID userId,
            @Param("from") LocalDate from
    );
}