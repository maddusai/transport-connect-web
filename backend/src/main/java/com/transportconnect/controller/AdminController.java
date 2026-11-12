package com.transportconnect.controller;

import com.transportconnect.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final FreightLoadRepository loadRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRecordRepository paymentRepository;

    @GetMapping("/overview")
    public ResponseEntity<?> getOverview() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalVehicles", vehicleRepository.count());
        stats.put("totalLoads", loadRepository.count());
        stats.put("totalBookings", bookingRepository.count());
        stats.put("pendingPayments", paymentRepository.findAllByOrderBySubmittedAtDesc().stream()
                .filter(p -> "PENDING".equals(p.getStatus())).count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("phone", u.getPhone());
            m.put("companyName", u.getCompanyName());
            m.put("city", u.getCity());
            m.put("gstNumber", u.getGstNumber());
            m.put("role", u.getRole());
            m.put("createdAt", u.getCreatedAt());
            return m;
        }).toList());
    }
}