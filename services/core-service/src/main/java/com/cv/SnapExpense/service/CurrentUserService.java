package com.cv.SnapExpense.service;

import com.cv.SnapExpense.exception.UnauthorizedException;
import com.cv.SnapExpense.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserService {

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new UnauthorizedException("User not found");
        }

        return (User) auth.getPrincipal();
    }
}
