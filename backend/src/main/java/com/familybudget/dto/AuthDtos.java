package com.familybudget.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record AuthResponse(
            String token,
            String refreshToken,
            UserSummary user
    ) {
    }

    public record RefreshTokenRequest(
            @NotBlank String refreshToken
    ) {
    }

    public record UserSummary(
            String id,
            String fullName,
            String email
    ) {
    }
}
