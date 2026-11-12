package com.transportconnect.dto;

import com.transportconnect.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatMessageResponse {
    private Long id;
    private Long bookingId;
    private Long senderId;
    private String senderName;
    private Role senderRole;
    private String message;
    private Boolean isRead;
    private LocalDateTime sentAt;
}