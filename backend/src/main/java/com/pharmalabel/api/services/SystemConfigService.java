package com.pharmalabel.api.services;

import com.pharmalabel.api.models.SystemConfig;
import com.pharmalabel.api.repositories.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SystemConfigService {

    private final SystemConfigRepository repository;

    @Transactional(readOnly = true)
    public String getConfigValue(String key, String defaultValue) {
        return repository.findByConfigKey(key)
                .map(SystemConfig::getConfigValue)
                .orElse(defaultValue);
    }
    
    @Transactional(readOnly = true)
    public boolean getBooleanConfig(String key, boolean defaultValue) {
        String val = getConfigValue(key, String.valueOf(defaultValue));
        return Boolean.parseBoolean(val);
    }

    @Transactional
    public SystemConfig saveConfig(String key, String value, String description) {
        SystemConfig config = repository.findByConfigKey(key).orElseGet(() -> {
            SystemConfig newConfig = new SystemConfig();
            newConfig.setConfigKey(key);
            return newConfig;
        });
        
        config.setConfigValue(value);
        if (description != null) {
            config.setDescription(description);
        }
        
        return repository.save(config);
    }
}
