package com.cv.SnapExpense.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface S3Service {
    String uploadReceipt(MultipartFile receipt, String userId) throws IOException;

    String generateGetPresignedUrl(String filePath);
}
