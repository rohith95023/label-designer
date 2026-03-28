package com.pharmalabel.api.exceptions;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppError.class)
    public ResponseEntity<Map<String, Object>> handleAppError(AppError ex) {
        if (ex.isOperational()) {
            Map<String, Object> body = new HashMap<>();
            body.put("success", false);
            body.put("code", ex.getCode());
            body.put("message", ex.getMessage());
            return ResponseEntity.status(ex.getStatusCode()).body(body);
        }
        
        logger.error("UNHANDLED APP ERROR", ex);
        return generateDefaultError(ex);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        logger.error("UNHANDLED ERROR", ex);
        return generateDefaultError(ex);
    }

    private ResponseEntity<Map<String, Object>> generateDefaultError(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", "Something went wrong: " + ex.getMessage());
        body.put("type", ex.getClass().getName());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
