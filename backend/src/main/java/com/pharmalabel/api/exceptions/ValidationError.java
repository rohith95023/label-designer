package com.pharmalabel.api.exceptions;

public class ValidationError extends AppError {
    public ValidationError(String message) {
        super(message, 400, "VALIDATION_ERROR");
    }
}
