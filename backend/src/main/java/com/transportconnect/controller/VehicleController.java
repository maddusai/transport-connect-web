package com.transportconnect.controller;

import com.transportconnect.dto.VehicleRequest;
import com.transportconnect.enums.VehicleStatus;
import com.transportconnect.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<?> getAvailableVehicles(@RequestParam(required = false) String city) {
        return ResponseEntity.ok(vehicleService.getAllAvailableVehicles(city));
    }

    @PostMapping
    public ResponseEntity<?> addVehicle(@Valid @RequestBody VehicleRequest request, Authentication auth) {
        try {
            return ResponseEntity.ok(vehicleService.addVehicle(request, auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyVehicles(Authentication auth) {
        return ResponseEntity.ok(vehicleService.getMyVehicles(auth.getName()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestParam VehicleStatus status,
                                          Authentication auth) {
        try {
            return ResponseEntity.ok(vehicleService.updateStatus(id, status, auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}