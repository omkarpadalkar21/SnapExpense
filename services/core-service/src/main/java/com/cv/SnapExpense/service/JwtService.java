package com.cv.SnapExpense.service;

import com.cv.SnapExpense.model.RefreshToken;
import com.cv.SnapExpense.model.User;
import com.cv.SnapExpense.repository.RefreshTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Optional;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class JwtService {
    @Value("${jwt.secret.key}")
    private String secretKey;

    @Value("${jwt.access-key.expiration}")
    private Long accessKeyExpiration;

    @Value("${jwt.refresh-key.expiration}")
    private Long refreshKeyExpiration;

    private final RefreshTokenRepository refreshTokenRepository;

    public String extractUsername(String token) {
        return extractClaims(token, Claims::getSubject);
    }

    private <T> T extractClaims(String token, Function<Claims, T> claimResolver) {
        Claims claims = extractAllClaims(token);
        return claimResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private String generateAccessToken(UserDetails userDetails) {
        return buildToken(new HashMap<>(), userDetails, accessKeyExpiration);
    }

    private String generateRefreshToken(UserDetails userDetails, String ipAddress) {
        String token = buildToken(new HashMap<>(), userDetails, refreshKeyExpiration);

        RefreshToken refreshToken = RefreshToken.builder()
                .user((User) userDetails)
                .token(token)
                .expiresAt(LocalDateTime.now().plus(Duration.ofMillis(refreshKeyExpiration)))
                .ipAddress(ipAddress)
                .build();

        refreshTokenRepository.save(refreshToken);

        return token;
    }

    private boolean validateRefreshToken(String token){
        Optional<RefreshToken> refreshToken = refreshTokenRepository.getRefreshTokenByToken(token);

        return refreshToken.map(value -> value.getExpiresAt().isAfter(LocalDateTime.now())).orElse(false);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Date extractExpiration(String token) {
        return extractClaims(token, Claims::getExpiration);
    }

    private String buildToken(
            HashMap<String, Object> claims,
            UserDetails userDetails,
            Long keyExpiration
    ) {
        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + keyExpiration))
                .signWith(getSigningKey())
                .compact();
    }

}
