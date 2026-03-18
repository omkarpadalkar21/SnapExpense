package com.cv.SnapExpense.dto.receipt;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ReceiptResponse {
    private UUID id;
    private String imageUrl;
    private String merchantName;
    private BigDecimal totalAmount;
    private LocalDate receiptDate;
    private CategoryResponse category;
    private List<ReceiptItemResponse> items;
    private BigDecimal ocrConfidence;
    private Boolean isVerified;
    private String notes;
    private LocalDateTime createdAt;
}
