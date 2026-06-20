package com.familybudget.controller;

import com.familybudget.auth.JwtService;
import com.familybudget.dto.AuthDtos.AuthResponse;
import com.familybudget.dto.AuthDtos.LoginRequest;
import com.familybudget.dto.AuthDtos.RegisterRequest;
import com.familybudget.dto.AuthDtos.UserSummary;
import com.familybudget.entity.User;
import com.familybudget.repository.UserRepository;
import com.familybudget.service.CurrentUserService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUserService currentUserService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CurrentUserService currentUserService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        return authResponse(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return authResponse(user);
    }

    @GetMapping("/me")
    public UserSummary me(Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        User user = userRepository.findById(currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        return new UserSummary(user.getId().toString(), user.getFullName(), user.getEmail());
    }

    private AuthResponse authResponse(User user) {
        return new AuthResponse(
                jwtService.createToken(user),
                new UserSummary(user.getId().toString(), user.getFullName(), user.getEmail())
        );
    }
}
