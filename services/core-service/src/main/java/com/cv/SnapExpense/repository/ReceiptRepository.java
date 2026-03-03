package com.cv.SnapExpense.repository;

import com.cv.SnapExpense.model.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReceiptRepository extends JpaRepository<Receipt, UUID> {
}