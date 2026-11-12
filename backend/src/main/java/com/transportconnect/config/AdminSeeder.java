package com.transportconnect.config;

import com.transportconnect.entity.User;
import com.transportconnect.enums.Role;
import com.transportconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String adminEmail = "admin@transportconnect.com";
        String adminPhone = "7075086485";

        if (!userRepository.existsByEmail(adminEmail) && !userRepository.existsByPhone(adminPhone)) {
            User admin = User.builder()
                    .name("SAI MADDU")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Sana@2124"))
                    .phone(adminPhone)
                    .role(Role.ADMIN)
                    .build();

            userRepository.save(admin);
            System.out.println("Default Admin account inserted successfully: " + adminEmail);
        }
    }
}