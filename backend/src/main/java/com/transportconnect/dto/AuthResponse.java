package com.transportconnect.dto;

import com.transportconnect.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String companyName;
    private String city;
    private String gstNumber;
    private Role role;
}
