package com.familybudget.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.familybudget.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
public class SecurityErrorHandlers implements AuthenticationEntryPoint, AccessDeniedHandler {

    private static final Logger log = LoggerFactory.getLogger(SecurityErrorHandlers.class);

    private final ObjectMapper objectMapper;

    public SecurityErrorHandlers(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {
        log.warn("AUTHENTICATION_FAILED requestId={} method={} path={} message={}", requestId(), request.getMethod(), request.getRequestURI(), authException.getMessage());
        writeError(response, ApiErrorResponse.of(
                requestId(),
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "Authentication is required.",
                request.getRequestURI()
        ));
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException {
        log.warn("AUTHORIZATION_FAILED requestId={} method={} path={} message={}", requestId(), request.getMethod(), request.getRequestURI(), accessDeniedException.getMessage());
        writeError(response, ApiErrorResponse.of(
                requestId(),
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                "You do not have permission to perform this action.",
                request.getRequestURI()
        ));
    }

    private void writeError(HttpServletResponse response, ApiErrorResponse error) throws IOException {
        response.setStatus(error.status());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }

    private String requestId() {
        String requestId = MDC.get("requestId");
        return requestId == null ? "-" : requestId;
    }
}
