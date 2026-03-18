package com.cv.SnapExpense.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegistrationResponse {
    private String id;
    private String name;
    private String email;
    private String accessToken;
    private String refreshToken;
}
