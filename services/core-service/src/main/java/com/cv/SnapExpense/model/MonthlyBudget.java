package com.cv.SnapExpense.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

@Entity
@Table(
        name = "monthly_budgets",
        indexes = {
                @Index(name = "idx_budgets_user_month", columnList = "user_id, month")
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_budget_user_category_month",
                        columnNames = {"user_id", "category_id", "month"}
                )
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyBudget {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", referencedColumnName = "id")
    private Category category;

    @Column(nullable = false)
    private YearMonth month;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal budget;
}
