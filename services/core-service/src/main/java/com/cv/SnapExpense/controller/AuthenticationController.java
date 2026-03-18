package com.cv.SnapExpense.controller;

import com.cv.SnapExpense.dto.LoginRequest;
import com.cv.SnapExpense.dto.LoginResponse;
import com.cv.SnapExpense.dto.RegistrationRequest;
import com.cv.SnapExpense.dto.RegistrationResponse;
import com.cv.SnapExpense.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    public ResponseEntity<RegistrationResponse> register(@RequestBody @Valid RegistrationRequest registrationRequest) {
        return new ResponseEntity<>(
                authenticationService.register(registrationRequest),
                HttpStatus.CREATED
        );
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest loginRequest) {
        return ResponseEntity.ok().body(authenticationService.login(loginRequest));
    }


}

