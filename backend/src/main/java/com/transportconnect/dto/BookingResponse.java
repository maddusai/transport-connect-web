package com.transportconnect.dto;

import com.transportconnect.enums.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BookingResponse {
    private Long id;
    private String bookingCode;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long transporterId;
    private String transporterName;
    private String transporterCompany;
    private String transporterPhone;
    private Long vehicleId;
    private String vehicleRegistration;
    private String vehicleType;
    private String driverName;
    private String driverPhone;
    private Long loadId;
    private String pickupCity;
    private String pickupAddress;
    private String dropCity;
    private String dropAddress;
    private String pickupDate;
    private Double totalAmount;
    private BookingStatus status;
    private Double currentLatitude;
    private Double currentLongitude;
    private String currentLocationLabel;
    private Double speedKmph;
    private Integer progressPercent;
    private String estimatedArrival;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}