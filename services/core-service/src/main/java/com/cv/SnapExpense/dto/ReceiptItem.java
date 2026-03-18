package com.cv.SnapExpense.dto;

import lombok.Data;

@Data
public class ReceiptItem {
    private String name;
    private Double quantity;
    private Double unitPrice;
    private Double totalPrice;
}
