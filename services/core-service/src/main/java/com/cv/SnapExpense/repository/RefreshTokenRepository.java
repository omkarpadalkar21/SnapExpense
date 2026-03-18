package com.cv.SnapExpense.repository;

import com.cv.SnapExpense.model.RefreshToken;
import com.cv.SnapExpense.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> getRefreshTokenByToken(String token);

    Optional<RefreshToken> getRefreshTokenByUserAndExpiresAtAfter(User user, LocalDateTime expiresAtAfter);
}