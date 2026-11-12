package com.transportconnect.service;

import com.transportconnect.dto.AuthResponse;
import com.transportconnect.dto.LoginRequest;
import com.transportconnect.dto.RegisterRequest;
import com.transportconnect.entity.User;
import com.transportconnect.repository.UserRepository;
import com.transportconnect.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    private String normalizePhone(String raw) {
        if (raw == null) return "";
        String digits = raw.replaceAll("\\D", "");
        if (digits.startsWith("91") && digits.length() == 12) return digits.substring(2);
        if (digits.startsWith("0") && digits.length() == 11) return digits.substring(1);
        return digits;
    }

    public AuthResponse register(RegisterRequest request) {
        String normalizedPhone = normalizePhone(request.getPhone());
        request.setPhone(normalizedPhone);
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("This email address is already registered.");
        }
        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new RuntimeException("This mobile number is already registered.");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(normalizedPhone)
                .companyName(request.getCompanyName())
                .city(request.getCity())
                .gstNumber(request.getGstNumber())
                .role(request.getRole())
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getRole().name());

        return mapToResponse(savedUser, token);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrPhone(request.getIdentifier(), request.getIdentifier())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
        );

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return mapToResponse(user, token);
    }

    private AuthResponse mapToResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .companyName(user.getCompanyName())
                .city(user.getCity())
                .gstNumber(user.getGstNumber())
                .role(user.getRole())
                .build();
    }
}