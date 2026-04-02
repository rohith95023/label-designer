package com.pharmalabel.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${upload.path:uploads}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path root = Paths.get(uploadPath).toAbsolutePath().normalize();
        String absPath = root.toString().replace("\\", "/");
        if (!absPath.endsWith("/")) absPath += "/";
        
        // This maps the URL to the file system and EXPLICITLY enables CORS
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absPath)
                .setCachePeriod(3600)
                .resourceChain(true);

        System.out.println("Serving static files from: file:" + absPath);
    }
}
