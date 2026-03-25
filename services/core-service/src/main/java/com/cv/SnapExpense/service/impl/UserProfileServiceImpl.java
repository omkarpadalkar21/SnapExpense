package com.cv.SnapExpense.service.impl;

import com.cv.SnapExpense.dto.UserProfileDto;
import com.cv.SnapExpense.dto.UserProfileUpdateDto;
import com.cv.SnapExpense.model.User;
import com.cv.SnapExpense.repository.UserRepository;
import com.cv.SnapExpense.service.CurrentUserService;
import com.cv.SnapExpense.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getUserProfile() {
        User user = currentUserService.getCurrentUser();

        return UserProfileDto.builder()
                .id(user.getId().toString())
                .name(user.getName())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt().toString())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserProfileDto updateUserProfile(UserProfileUpdateDto updateDto) {
        User user = currentUserService.getCurrentUser();

        if (updateDto == null || updateDto.getName() == null || updateDto.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }

        user.setName(updateDto.getName());
        user = userRepository.save(user);

        return UserProfileDto.builder()
                .id(user.getId().toString())
                .name(user.getName())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt().toString())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteUserProfile() {
        User user = currentUserService.getCurrentUser();
        userRepository.delete(user);
    }
}
