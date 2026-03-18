package com.cv.SnapExpense.service.impl;

import com.cv.SnapExpense.dto.ReceiptOcrResponse;
import com.cv.SnapExpense.dto.receipt.*;
import com.cv.SnapExpense.mapper.ReceiptMapper;
import com.cv.SnapExpense.model.Category;
import com.cv.SnapExpense.model.Receipt;
import com.cv.SnapExpense.model.ReceiptItem;
import com.cv.SnapExpense.model.User;
import com.cv.SnapExpense.repository.CategoryRepository;
import com.cv.SnapExpense.repository.ReceiptRepository;
import com.cv.SnapExpense.repository.UserRepository;
import com.cv.SnapExpense.service.FastAPIService;
import com.cv.SnapExpense.service.ReceiptService;
import com.cv.SnapExpense.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReceiptServiceImpl implements ReceiptService {

    private final ReceiptRepository receiptRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ReceiptMapper receiptMapper;
    private final S3Service s3Service;
    private final FastAPIService fastAPIService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    @Transactional
    public ReceiptResponse uploadReceipt(MultipartFile image, Integer categoryId, String notes) throws IOException {
        User user = getCurrentUser();

        String filePath = s3Service.uploadReceipt(image, user.getId().toString());

        // TODO: Upload image to S3 and get URL
        String imageUrl = s3Service.generateGetPresignedUrl(filePath);

        // TODO: Send presigned URL to FastAPI and get extracted data
        ReceiptOcrResponse receiptOcrResponse = fastAPIService.extractReceiptInfo(imageUrl);
        // Mocking extracted data for now
        Category category = null;
        if (categoryId != null) {
            category = categoryRepository.findById(categoryId).orElseThrow(() -> new IllegalArgumentException("Category not found"));
        }

        Receipt receipt = Receipt.builder()
                .user(user)
                .imageUrl(imageUrl)
                .category(category)
                .merchantName(receiptOcrResponse.getMerchantName())
                .totalAmount(receiptOcrResponse.getTotalAmount())
                .receiptDate(receiptOcrResponse.getReceiptDate() != null
                        ? LocalDate.parse(receiptOcrResponse.getReceiptDate())
                        : null)
                .ocrConfidence(receiptOcrResponse.getOcrConfidence())
                .isVerified(false)
                .notes(notes)
                .items(new ArrayList<>())
                .build();

        receipt = receiptRepository.save(receipt);
        return receiptMapper.toReceiptResponse(receipt);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReceiptResponse> getReceipts(String month, Integer categoryId, Pageable pageable) {
        // TODO: In a real app, you would filter by month and categoryId using a Specification or a custom Query.
        // For now, this just retrieves all paginated receipts for the current user.
        Page<Receipt> page = receiptRepository.findAll(pageable); // Should filter by user

        List<ReceiptResponse> content = page.getContent().stream()
                .map(receiptMapper::toReceiptResponse)
                .collect(Collectors.toList());

        return PageResponse.<ReceiptResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ReceiptResponse getReceiptById(UUID id) {
        Receipt receipt = receiptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Receipt not found"));
        return receiptMapper.toReceiptResponse(receipt);
    }

    @Override
    @Transactional
    public ReceiptResponse updateReceipt(UUID id, ReceiptUpdateRequest request) {
        Receipt receipt = receiptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Receipt not found"));

        receipt.setMerchantName(request.getMerchantName());
        receipt.setTotalAmount(request.getTotalAmount());
        receipt.setReceiptDate(request.getReceiptDate());
        receipt.setNotes(request.getNotes());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            receipt.setCategory(category);
        }

        if (request.getItems() != null) {
            receipt.getItems().clear();
            for (ReceiptItemRequest itemReq : request.getItems()) {
                ReceiptItem item = ReceiptItem.builder()
                        .receipt(receipt)
                        .name(itemReq.getName())
                        .quantity(itemReq.getQuantity())
                        .unitPrice(itemReq.getUnitPrice())
                        .totalAmount(itemReq.getTotalPrice())
                        .build();
                receipt.getItems().add(item);
            }
        }

        receipt = receiptRepository.save(receipt);
        return receiptMapper.toReceiptResponse(receipt);
    }

    @Override
    @Transactional
    public void deleteReceipt(UUID id) {
        receiptRepository.deleteById(id);
    }

    @Override
    @Transactional
    public ReceiptVerificationResponse verifyReceipt(UUID id) {
        Receipt receipt = receiptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Receipt not found"));

        receipt.setIsVerified(true);
        receipt = receiptRepository.save(receipt);

        return ReceiptVerificationResponse.builder()
                .id(receipt.getId())
                .isVerified(receipt.getIsVerified())
                .build();
    }
}
