package com.cv.SnapExpense.service;

import com.cv.SnapExpense.dto.UserProfileDto;
import com.cv.SnapExpense.dto.UserProfileUpdateDto;

public interface UserProfileService {
    UserProfileDto getUserProfile();

    UserProfileDto updateUserProfile(UserProfileUpdateDto updateDto);

    void deleteUserProfile();
}
