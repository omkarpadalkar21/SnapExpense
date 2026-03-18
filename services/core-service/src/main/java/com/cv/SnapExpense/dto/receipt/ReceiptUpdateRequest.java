package com.cv.SnapExpense.dto.receipt;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ReceiptUpdateRequest {
    private String merchantName;
    private BigDecimal totalAmount;
    private LocalDate receiptDate;
    private Integer categoryId;
    private String notes;
    private List<ReceiptItemRequest> items;
}
