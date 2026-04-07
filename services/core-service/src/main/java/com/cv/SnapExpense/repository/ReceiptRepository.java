package com.cv.SnapExpense.repository;

import com.cv.SnapExpense.dto.CategoryBreakdown;
import com.cv.SnapExpense.dto.SpendingTrendRow;
import com.cv.SnapExpense.model.Receipt;
import com.cv.SnapExpense.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ReceiptRepository extends JpaRepository<Receipt, UUID> {

    /**
     * Fetch receipts for a specific user, with optional month range and category filters.
     * Month/category params use IS NULL checks so callers can pass null to skip filtering.
     */
    @Query("""
            SELECT r FROM Receipt r
            WHERE r.user = :user
              AND (cast(:monthStart as date) IS NULL OR r.receiptDate >= :monthStart)
              AND (cast(:monthEnd as date)   IS NULL OR r.receiptDate <  :monthEnd)
              AND (cast(:categoryId as int) IS NULL OR r.category.id = :categoryId)
            """)
    Page<Receipt> findByUserFiltered(
            @Param("user") User user,
            @Param("monthStart") LocalDate monthStart,
            @Param("monthEnd") LocalDate monthEnd,
            @Param("categoryId") Integer categoryId,
            Pageable pageable
    );

    @Query("""
                SELECT SUM(r.totalAmount), COUNT(r)
                FROM Receipt r
                WHERE r.user = :user
                    AND r.receiptDate >= cast(:monthStart as date)
                    AND r.receiptDate < cast(:monthEnd as date)
            """)
    List<Object[]> getMonthlySummary(
            @Param("user") User user,
            @Param("monthStart") LocalDate monthStart,
            @Param("monthEnd") LocalDate monthEnd
    );

    @Query("""
                SELECT r.category           AS category,
                       SUM(r.totalAmount)   AS spent,
                       COUNT(r)             AS receiptCount,
                       0.0                  AS budget
                FROM Receipt r
                WHERE r.user = :user
                    AND r.receiptDate >= cast(:monthStart as date)
                    AND r.receiptDate < cast(:monthEnd as date)
                GROUP BY r.category
                ORDER BY SUM(r.totalAmount) DESC
            """)
    List<CategoryBreakdown> getMonthlyCategoryBreakdown(
            @Param("user") User user,
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