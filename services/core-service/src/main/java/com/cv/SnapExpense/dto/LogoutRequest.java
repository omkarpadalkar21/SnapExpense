package com.cv.SnapExpense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LogoutRequest {
    @NotBlank(message = "Access Token is required")
    @NotNull(message = "Access Token is required")
    private String accessToken;

    @NotBlank(message = "Refresh Token is required")
    @NotNull(message = "Refresh Token is required")
    private String refreshToken;
}
