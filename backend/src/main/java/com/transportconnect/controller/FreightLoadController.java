package com.transportconnect.controller;

import com.transportconnect.dto.LoadRequest;
import com.transportconnect.enums.LoadStatus;
import com.transportconnect.service.FreightLoadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/loads")
@RequiredArgsConstructor
public class FreightLoadController {

    private final FreightLoadService loadService;

    @GetMapping
    public ResponseEntity<?> getOpenLoads(@RequestParam(required = false) String pickupCity,
                                          @RequestParam(required = false) String dropCity) {
        return ResponseEntity.ok(loadService.getOpenLoads(pickupCity, dropCity));
    }

    @PostMapping
    public ResponseEntity<?> createLoad(@Valid @RequestBody LoadRequest request, Authentication auth) {
        try {
            return ResponseEntity.ok(loadService.createLoad(request, auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyLoads(Authentication auth) {
        return ResponseEntity.ok(loadService.getMyPostedLoads(auth.getName()));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptLoad(@PathVariable Long id, Authentication auth) {
        try {
            return ResponseEntity.ok(loadService.acceptLoad(id, auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam LoadStatus status) {
        try {
            return ResponseEntity.ok(loadService.updateLoadStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}