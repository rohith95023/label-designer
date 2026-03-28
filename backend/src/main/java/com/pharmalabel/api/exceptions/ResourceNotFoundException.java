package com.pharmalabel.api.exceptions;

public class ResourceNotFoundException extends AppError {
    public ResourceNotFoundException(String resourceName) {
        super(resourceName + " not found", 404, "NOT_FOUND");
    }
}
