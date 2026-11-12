package com.transportconnect.repository;

import com.transportconnect.entity.TripChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TripChatMessageRepository extends JpaRepository<TripChatMessage, Long> {
    List<TripChatMessage> findByBookingIdOrderBySentAtAsc(Long bookingId);
}