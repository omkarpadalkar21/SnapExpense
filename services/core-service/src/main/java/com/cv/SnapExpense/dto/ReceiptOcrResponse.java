package com.cv.SnapExpense.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ReceiptOcrResponse {
    private String merchantName;
    private BigDecimal totalAmount;
    private String receiptDate;
    private List<ReceiptItem> items;
    private String ocrRawText;
    private BigDecimal ocrConfidence;
}
