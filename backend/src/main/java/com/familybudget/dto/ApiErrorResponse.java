package com.familybudget.dto;

import java.time.Instant;
import java.util.Map;

public record ApiErrorResponse(
        Instant timestamp,
        String requestId,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors
) {
    public static ApiErrorResponse of(String requestId, int status, String error, String message, String path) {
        return new ApiErrorResponse(Instant.now(), requestId, status, error, message, path, null);
    }

    public static ApiErrorResponse withFieldErrors(
            String requestId,
            int status,
            String error,
            String message,
            String path,
            Map<String, String> fieldErrors
    ) {
        return new ApiErrorResponse(Instant.now(), requestId, status, error, message, path, fieldErrors);
    }
}
