package com.cv.SnapExpense.dto.receipt;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ReceiptItemRequest {
    private String name;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}
