package com.familybudget.logging;

import com.familybudget.auth.AuthenticatedUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String MDC_REQUEST_ID = "requestId";
    public static final String MDC_USER_ID = "userId";
    public static final String MDC_WORKSPACE_ID = "workspaceId";

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
    private static final Pattern WORKSPACE_PATH_PATTERN = Pattern.compile("/workspaces/([0-9a-fA-F-]{36})");

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestId = resolveRequestId(request);
        long startNanos = System.nanoTime();
        String path = request.getRequestURI();
        String clientIp = resolveClientIp(request);
        String userId = resolveUserId();
        String workspaceId = resolveWorkspaceId(request);

        MDC.put(MDC_REQUEST_ID, requestId);
        putIfPresent(MDC_USER_ID, userId);
        putIfPresent(MDC_WORKSPACE_ID, workspaceId);
        response.setHeader(REQUEST_ID_HEADER, requestId);

        log.info(
                "REQUEST_START requestId={} method={} path={} query={} ip={} userId={} workspaceId={} userAgent=\"{}\" startTime={}",
                requestId,
                request.getMethod(),
                path,
                safeValue(request.getQueryString()),
                clientIp,
                safeValue(userId),
                safeValue(workspaceId),
                safeValue(request.getHeader("User-Agent")),
                Instant.now()
        );

        try {
            filterChain.doFilter(request, response);
        } finally {
            String finalUserId = resolveUserId();
            if (finalUserId != null) {
                MDC.put(MDC_USER_ID, finalUserId);
            }
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            log.info(
                    "REQUEST_END requestId={} method={} path={} status={} durationMs={} userId={} ip={}",
                    requestId,
                    request.getMethod(),
                    path,
                    response.getStatus(),
                    durationMs,
                    safeValue(finalUserId == null ? userId : finalUserId),
                    clientIp
            );
            MDC.clear();
        }
    }

    public static String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    private String resolveRequestId(HttpServletRequest request) {
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        return requestId == null || requestId.isBlank() ? UUID.randomUUID().toString() : requestId.trim();
    }

    private String resolveUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthenticatedUser authenticatedUser) {
            return authenticatedUser.userId().toString();
        }
        return null;
    }

    private String resolveWorkspaceId(HttpServletRequest request) {
        String headerWorkspaceId = request.getHeader("X-Workspace-Id");
        if (headerWorkspaceId != null && !headerWorkspaceId.isBlank()) {
            return headerWorkspaceId.trim();
        }
        Matcher matcher = WORKSPACE_PATH_PATTERN.matcher(request.getRequestURI());
        return matcher.find() ? matcher.group(1) : null;
    }

    private void putIfPresent(String key, String value) {
        if (value != null && !value.isBlank()) {
            MDC.put(key, value);
        }
    }

    private String safeValue(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
