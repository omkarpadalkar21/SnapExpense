package com.cv.SnapExpense.repository;

import com.cv.SnapExpense.model.MonthlyBudget;
import com.cv.SnapExpense.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.YearMonth;
import java.util.List;

public interface MonthlyBudgetRepository extends JpaRepository<MonthlyBudget, Integer> {
    List<MonthlyBudget> findAllByUserAndMonth(User user, YearMonth month);
}