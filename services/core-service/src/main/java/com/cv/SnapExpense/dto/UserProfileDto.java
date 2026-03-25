package com.cv.SnapExpense.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileDto {
    private String id;
    private String name;
    private String email;
    private String createdAt;
}
