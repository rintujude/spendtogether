package com.familybudget.config;

import com.familybudget.auth.AuthenticatedUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketLifecycleLogger {

    private static final Logger log = LoggerFactory.getLogger(WebSocketLifecycleLogger.class);

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String userId = accessor.getUser() instanceof AuthenticatedUser user ? user.userId().toString() : "-";
        log.info("WebSocket disconnect sessionId={} userId={} closeStatus={}", accessor.getSessionId(), userId, event.getCloseStatus());
    }
}
