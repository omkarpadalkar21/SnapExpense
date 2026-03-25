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
