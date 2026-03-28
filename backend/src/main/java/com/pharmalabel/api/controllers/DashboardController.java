package com.pharmalabel.api.controllers;

import com.pharmalabel.api.models.UserSession;
import com.pharmalabel.api.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserSession> getDashboardData(@PathVariable String userId) {
        return ResponseEntity.ok(dashboardService.getDashboardData(userId));
    }

    @PostMapping("/{userId}")
    public ResponseEntity<UserSession> saveDashboardData(@PathVariable String userId, @RequestBody java.util.Map<String, Object> data) {
        return ResponseEntity.ok(dashboardService.saveDashboardData(userId, data));
    }
}
