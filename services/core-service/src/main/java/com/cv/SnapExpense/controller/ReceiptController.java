package com.cv.SnapExpense.controller;

import com.cv.SnapExpense.dto.receipt.PageResponse;
import com.cv.SnapExpense.dto.receipt.ReceiptResponse;
import com.cv.SnapExpense.dto.receipt.ReceiptUpdateRequest;
import com.cv.SnapExpense.dto.receipt.ReceiptVerificationResponse;
import com.cv.SnapExpense.service.ReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
public class ReceiptController {

    private final ReceiptService receiptService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReceiptResponse> uploadReceipt(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "categoryId", required = false) Integer categoryId,
            @RequestParam(value = "notes", required = false) String notes
    ) throws IOException {
        ReceiptResponse response = receiptService.uploadReceipt(image, categoryId, notes);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<ReceiptResponse>> getReceipts(
            @RequestParam(value = "month", required = false) String month,
            @RequestParam(value = "categoryId", required = false) Integer categoryId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", defaultValue = "receiptDate,desc") String sort
    ) {
        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc") ?
                Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        PageResponse<ReceiptResponse> response = receiptService.getReceipts(month, categoryId, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReceiptResponse> getReceiptById(@PathVariable UUID id) {
        return ResponseEntity.ok(receiptService.getReceiptById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReceiptResponse> updateReceipt(
            @PathVariable UUID id,
            @RequestBody ReceiptUpdateRequest request
    ) {
        return ResponseEntity.ok(receiptService.updateReceipt(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReceipt(@PathVariable UUID id) {
        receiptService.deleteReceipt(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/verify")
    public ResponseEntity<ReceiptVerificationResponse> verifyReceipt(@PathVariable UUID id) {
        return ResponseEntity.ok(receiptService.verifyReceipt(id));
    }
}
