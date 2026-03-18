package com.cv.SnapExpense.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NewAccessTokenRequest {

    @Email(message = "The email should be of valid format")
    @NotBlank(message = "Email is required")
    @NotNull(message = "Email is required")
    private String email;

    @NotNull(message = "Access token is required")
    @NotBlank(message = "Access token is required")
    private String refreshToken;
}
