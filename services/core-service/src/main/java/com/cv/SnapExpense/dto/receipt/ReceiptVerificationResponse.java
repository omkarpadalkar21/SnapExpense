package com.cv.SnapExpense.dto.receipt;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ReceiptVerificationResponse {
    private UUID id;
    private Boolean isVerified;
}
