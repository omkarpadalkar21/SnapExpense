package com.cv.SnapExpense.controller;

import com.cv.SnapExpense.dto.UserProfileDto;
import com.cv.SnapExpense.dto.UserProfileUpdateDto;
import com.cv.SnapExpense.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<UserProfileDto> getUserProfile() {
        return ResponseEntity.ok().body(userProfileService.getUserProfile());
    }

    @PutMapping
    public ResponseEntity<UserProfileDto> updateUserProfile(@RequestBody UserProfileUpdateDto updateDto) {
        return ResponseEntity.ok().body(userProfileService.updateUserProfile(updateDto));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteUserProfile() {
        userProfileService.deleteUserProfile();
        return ResponseEntity.noContent().build();
    }


}
