package com.transportconnect.service;

import com.transportconnect.dto.ChatMessageRequest;
import com.transportconnect.dto.ChatMessageResponse;
import com.transportconnect.entity.Booking;
import com.transportconnect.entity.TripChatMessage;
import com.transportconnect.entity.User;
import com.transportconnect.repository.BookingRepository;
import com.transportconnect.repository.TripChatMessageRepository;
import com.transportconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripChatService {

    private final TripChatMessageRepository chatRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public ChatMessageResponse sendMessage(Long bookingId, ChatMessageRequest request, String senderEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TripChatMessage msg = TripChatMessage.builder()
                .booking(booking)
                .sender(sender)
                .message(request.getMessage())
                .isRead(false)
                .build();

        return mapToResponse(chatRepository.save(msg));
    }

    public List<ChatMessageResponse> getMessagesForBooking(Long bookingId) {
        return chatRepository.findByBookingIdOrderBySentAtAsc(bookingId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ChatMessageResponse mapToResponse(TripChatMessage m) {
        return ChatMessageResponse.builder()
                .id(m.getId())
                .bookingId(m.getBooking().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getName())
                .senderRole(m.getSender().getRole())
                .message(m.getMessage())
                .isRead(m.getIsRead())
                .sentAt(m.getSentAt())
                .build();
    }
}