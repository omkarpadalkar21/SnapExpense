package com.cv.SnapExpense.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NewAccessTokenResponse {
    private String accessToken;
    private String expiresIn;
}
