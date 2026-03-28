package com.pharmalabel.api.services;

import com.pharmalabel.api.models.UserSession;

public interface DashboardService {
    UserSession getDashboardData(String userId);
    UserSession saveDashboardData(String userId, java.util.Map<String, Object> sessionData);
}
