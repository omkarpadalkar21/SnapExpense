package com.cv.SnapExpense.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegistrationRequest {

    @Size(min = 2, message = "The name should be minimum {min} characters long")
    @NotBlank(message = "Name is required")
    @NotNull(message = "Name is required")
    private String name;

    @Email(message = "The email should be of valid format")
    @NotBlank(message = "Email is required")
    @NotNull(message = "Email is required")
    private String email;

    @Size(min = 8, message = "The password must be minimum {min} characters long")
    @NotBlank(message = "Password is required")
    @NotNull(message = "Password is required")
    private String password;
}
