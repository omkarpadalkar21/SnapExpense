package com.cv.SnapExpense.service;

import com.cv.SnapExpense.dto.ReceiptOcrResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Service
public class FastAPIService {
    private final WebClient webClient;

    public FastAPIService(WebClient.Builder builder) {
        this.webClient = builder.baseUrl("http://localhost:8000").build();
    }

    public ReceiptOcrResponse extractReceiptInfo(String presignedUrl) {
        Map<String, String> body = new HashMap<>();
        body.put("presigned_url", presignedUrl);

        return webClient.post()
                .uri("/ocr/extract")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(ReceiptOcrResponse.class)
                .block();
    }
}
