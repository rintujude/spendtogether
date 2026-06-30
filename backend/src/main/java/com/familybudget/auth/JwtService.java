package com.familybudget.auth;

import com.familybudget.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expirationMinutes;
    private final long refreshExpirationMinutes;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes,
            @Value("${app.jwt.refresh-expiration-minutes}") long refreshExpirationMinutes
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
        this.refreshExpirationMinutes = refreshExpirationMinutes;
    }

    public String createToken(User user) {
        return createToken(user, expirationMinutes, "access");
    }

    public String createRefreshToken(User user) {
        return createToken(user, refreshExpirationMinutes, "refresh");
    }

    private String createToken(User user, long expiresInMinutes, String tokenType) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(expiresInMinutes * 60);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId().toString())
                .claim("tokenType", tokenType)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(secretKey)
                .compact();
    }

    public String extractSubject(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public UUID extractUserId(String token) {
        String userId = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("userId", String.class);

        return UUID.fromString(userId);
    }

    public boolean isRefreshToken(String token) {
        return hasTokenType(token, "refresh");
    }

    public boolean isAccessToken(String token) {
        return hasTokenType(token, "access");
    }

    private boolean hasTokenType(String token, String expectedTokenType) {
        String tokenType = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("tokenType", String.class);

        return expectedTokenType.equals(tokenType);
    }
}
