package com.transportconnect.controller;

import com.transportconnect.dto.ChatMessageRequest;
import com.transportconnect.service.TripChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bookings/{bookingId}/chat")
@RequiredArgsConstructor
public class TripChatController {

    private final TripChatService chatService;

    @GetMapping
    public ResponseEntity<?> getMessages(@PathVariable Long bookingId) {
        return ResponseEntity.ok(chatService.getMessagesForBooking(bookingId));
    }

    @PostMapping
    public ResponseEntity<?> sendMessage(@PathVariable Long bookingId,
                                         @Valid @RequestBody ChatMessageRequest request,
                                         Authentication auth) {
        try {
            return ResponseEntity.ok(chatService.sendMessage(bookingId, request, auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}