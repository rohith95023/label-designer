package com.pharmalabel.api.controllers;

import com.pharmalabel.api.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/migration")
@RequiredArgsConstructor
public class MigrationController {

    private final UserService userService;

    @PostMapping("/claim-init")
    public ResponseEntity<Map<String, String>> initiateClaim(@RequestBody Map<String, String> body) {
        String guestId = body.get("guestId");
        if (guestId == null) return ResponseEntity.badRequest().build();
        
        String claimToken = userService.initiateClaim(guestId);
        return ResponseEntity.ok(Map.of("claimToken", claimToken));
    }

    @PostMapping("/claim")
    public ResponseEntity<Void> executeClaim(@RequestBody Map<String, String> body) {
        String claimToken = body.get("claimToken");
        if (claimToken == null) return ResponseEntity.badRequest().build();
        
        userService.executeClaim(claimToken);
        return ResponseEntity.noContent().build();
    }
}
