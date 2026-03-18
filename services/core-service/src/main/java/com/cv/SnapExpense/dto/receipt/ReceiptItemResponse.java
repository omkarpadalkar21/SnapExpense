package com.cv.SnapExpense.dto.receipt;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ReceiptItemResponse {
    private UUID id;
    private String name;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}
