package com.pharmalabel.api.services.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmalabel.api.models.UserSession;
import com.pharmalabel.api.repositories.UserSessionRepository;
import com.pharmalabel.api.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final UserSessionRepository userSessionRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public UserSession getDashboardData(String userId) {
        return userSessionRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserSession newSession = new UserSession();
                    newSession.setUserId(userId);
                    return newSession;
                });
    }

    @Override
    @Transactional
    public UserSession saveDashboardData(String userId, Map<String, Object> sessionData) {
        int maxRetries = 2;
        for (int i = 0; i < maxRetries; i++) {
            try {
                UserSession existingSession = userSessionRepository.findByUserId(userId)
                        .orElseGet(() -> {
                            UserSession s = new UserSession();
                            s.setUserId(userId);
                            return s;
                        });

                if (sessionData.containsKey("dashboardPreferences")) {
                    existingSession.setDashboardPreferences(objectMapper.valueToTree(sessionData.get("dashboardPreferences")));
                }
                if (sessionData.containsKey("recentActivityLog")) {
                    existingSession.setRecentActivityLog(objectMapper.valueToTree(sessionData.get("recentActivityLog")));
                }
                
                existingSession.setLastAccessed(java.time.OffsetDateTime.now());

                return userSessionRepository.saveAndFlush(existingSession);
            } catch (DataIntegrityViolationException e) {
                if (i == maxRetries - 1) {
                    throw e; // Give up after retries
                }
                // If we get here, another thread inserted the row. The loop will retry,
                // findByUserId will now find the row, and we'll do an update instead.
            }
        }
        return null; // Should not reach here
    }
}
