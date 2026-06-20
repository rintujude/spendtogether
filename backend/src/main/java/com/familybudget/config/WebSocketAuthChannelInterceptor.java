package com.familybudget.config;

import com.familybudget.auth.AuthenticatedUser;
import com.familybudget.auth.JwtService;
import com.familybudget.entity.WorkspaceMember;
import com.familybudget.repository.WorkspaceMemberRepository;
import java.util.UUID;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthChannelInterceptor.class);

    private static final String WORKSPACE_TOPIC_PREFIX = "/topic/workspaces/";
    private static final String USER_NOTIFICATION_TOPIC_PREFIX = "/topic/users/";
    private static final String USER_NOTIFICATION_TOPIC_SUFFIX = "/notifications";

    private final JwtService jwtService;
    private final WorkspaceMemberRepository memberRepository;

    public WebSocketAuthChannelInterceptor(JwtService jwtService, WorkspaceMemberRepository memberRepository) {
        this.jwtService = jwtService;
        this.memberRepository = memberRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticate(accessor);
            log.info("WebSocket connect userId={}", accessor.getUser() instanceof AuthenticatedUser user ? user.userId() : "-");
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())
                || SimpMessageType.SUBSCRIBE.equals(accessor.getMessageType())) {
            authorizeSubscription(accessor);
        }

        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String authorization = accessor.getFirstNativeHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            log.warn("WebSocket authentication rejected reason=missing_token");
            throw new AccessDeniedException("Missing WebSocket authorization token");
        }

        String token = authorization.substring(7);
        try {
            accessor.setUser(new AuthenticatedUser(jwtService.extractUserId(token), jwtService.extractSubject(token)));
        } catch (RuntimeException ex) {
            log.warn("WebSocket authentication rejected reason=invalid_token");
            throw ex;
        }
    }

    private void authorizeSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) {
            return;
        }

        if (!(accessor.getUser() instanceof AuthenticatedUser authenticatedUser)) {
            throw new AccessDeniedException("Unauthenticated WebSocket subscription");
        }

        if (destination.startsWith(WORKSPACE_TOPIC_PREFIX)) {
            UUID workspaceId = UUID.fromString(destination.substring(WORKSPACE_TOPIC_PREFIX.length()));
            log.info("WebSocket workspace subscription attempt workspaceId={} userId={}", workspaceId, authenticatedUser.userId());
            if (!memberRepository.existsByWorkspaceIdAndUserIdAndStatus(
                    workspaceId,
                    authenticatedUser.userId(),
                    WorkspaceMember.Status.ACTIVE
            )) {
                log.warn("WebSocket workspace subscription rejected workspaceId={} userId={}", workspaceId, authenticatedUser.userId());
                throw new AccessDeniedException("User is not a member of this workspace");
            }
            return;
        }

        if (destination.startsWith(USER_NOTIFICATION_TOPIC_PREFIX)
                && destination.endsWith(USER_NOTIFICATION_TOPIC_SUFFIX)) {
            String userIdText = destination.substring(
                    USER_NOTIFICATION_TOPIC_PREFIX.length(),
                    destination.length() - USER_NOTIFICATION_TOPIC_SUFFIX.length()
            );
            UUID userId = UUID.fromString(userIdText);
            log.info("WebSocket notification subscription attempt targetUserId={} userId={}", userId, authenticatedUser.userId());
            if (!userId.equals(authenticatedUser.userId())) {
                log.warn("WebSocket notification subscription rejected targetUserId={} userId={}", userId, authenticatedUser.userId());
                throw new AccessDeniedException("User cannot subscribe to another user's notifications");
            }
        }
    }
}
