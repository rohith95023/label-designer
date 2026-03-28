package com.pharmalabel.api.exceptions;

import lombok.Getter;

@Getter
public class AppError extends RuntimeException {
    private final int statusCode;
    private final String code;
    private final boolean isOperational;

    public AppError(String message, int statusCode, String code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
    }
}
