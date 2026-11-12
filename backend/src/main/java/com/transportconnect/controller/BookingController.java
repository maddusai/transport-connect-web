package com.transportconnect.controller;

import com.transportconnect.dto.BookingRequest;
import com.transportconnect.dto.GpsLocationUpdateRequest;
import com.transportconnect.enums.BookingStatus;
import com.transportconnect.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<?> createBooking(@Valid @RequestBody BookingRequest request, Authentication auth) {
        try {
            return ResponseEntity.ok(bookingService.createBooking(request, auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(Authentication auth) {
        return ResponseEntity.ok(bookingService.getMyBookings(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(bookingService.getBookingById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam BookingStatus status) {
        try {
            return ResponseEntity.ok(bookingService.updateBookingStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/location")
    public ResponseEntity<?> updateLiveLocation(@PathVariable Long id,
                                                @Valid @RequestBody GpsLocationUpdateRequest request) {
        try {
            return ResponseEntity.ok(bookingService.updateLiveLocation(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}