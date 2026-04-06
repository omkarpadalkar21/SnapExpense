package com.cv.SnapExpense.service;

import com.cv.SnapExpense.dto.receipt.PageResponse;
import com.cv.SnapExpense.dto.receipt.ReceiptResponse;
import com.cv.SnapExpense.dto.receipt.ReceiptCreateRequest;
import com.cv.SnapExpense.dto.receipt.ReceiptUpdateRequest;
import com.cv.SnapExpense.dto.receipt.ReceiptVerificationResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

public interface ReceiptService {
    ReceiptResponse uploadReceipt(MultipartFile image, Integer categoryId, String notes) throws IOException;
    ReceiptResponse createReceipt(ReceiptCreateRequest request);
    PageResponse<ReceiptResponse> getReceipts(String month, Integer categoryId, Pageable pageable);
    ReceiptResponse getReceiptById(UUID id);
    ReceiptResponse updateReceipt(UUID id, ReceiptUpdateRequest request);
    void deleteReceipt(UUID id);
    ReceiptVerificationResponse verifyReceipt(UUID id);
}
