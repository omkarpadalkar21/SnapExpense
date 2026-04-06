package com.cv.SnapExpense.service;

import com.cv.SnapExpense.dto.*;
import com.cv.SnapExpense.model.RefreshToken;
import com.cv.SnapExpense.model.User;
import com.cv.SnapExpense.repository.RefreshTokenRepository;
import com.cv.SnapExpense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    @Value("${jwt.access-key.expiration}")
    private Long accessKeyExpiration;

    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;

    @Transactional(rollbackFor = Exception.class)
    public RegistrationResponse register(RegistrationRequest registrationRequest) {
        User user = User.builder()
                .name(registrationRequest.getName())
                .email(registrationRequest.getEmail())
                .password(passwordEncoder.encode(registrationRequest.getPassword()))
                .build();

        userRepository.save(user);

        return RegistrationResponse.builder()
                .id(user.getId().toString())
                .name(user.getName())
                .email(user.getEmail())
                .accessToken(jwtService.generateAccessToken(user))
                .refreshToken(jwtService.generateRefreshToken(user).getToken())
                .build();
    }

    @Transactional(rollbackFor = Exception.class)
    public LoginResponse login(LoginRequest loginRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        RefreshToken refreshToken = refreshTokenRepository.getRefreshTokenByUserAndExpiresAtAfter(user, LocalDateTime.now())
                .orElseGet(() -> jwtService.generateRefreshToken(user));

        return LoginResponse.builder()
                .accessToken(jwtService.generateAccessToken(user))
                .refreshToken(refreshToken.getToken())
                .expiresIn(refreshToken.getExpiresAt().toString())
                .build();
    }

    public void logout(LogoutRequest logoutRequest) {
        RefreshToken refreshToken = refreshTokenRepository.getRefreshTokenByToken(logoutRequest.getRefreshToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        refreshToken.setRevokedAt(LocalDateTime.now());


    }

    @Transactional(rollbackFor = Exception.class)
    public NewAccessTokenResponse getNewAccessToken(NewAccessTokenRequest newAccessTokenRequest) {
        User user = userRepository.findByEmail(newAccessTokenRequest.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        boolean isRefreshTokenValid = jwtService.isTokenValid(newAccessTokenRequest.getRefreshToken(), user);

        if (!isRefreshTokenValid) {
            return null;
        }

        Optional<RefreshToken> refreshToken = refreshTokenRepository.getRefreshTokenByToken(newAccessTokenRequest.getRefreshToken());

        if (refreshToken.isEmpty() || refreshToken.get().getRevokedAt() != null) {
            return null;
        }

        return NewAccessTokenResponse.builder()
                .accessToken(jwtService.generateAccessToken(user))
                .expiresIn(accessKeyExpiration.toString())
                .build();
    }
}
