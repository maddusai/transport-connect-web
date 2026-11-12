package com.transportconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingRequest {
    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    private Long loadId; // Optional: link to an existing FreightLoad

    @NotBlank(message = "Pickup city is required")
    private String pickupCity;

    private String pickupAddress;

    @NotBlank(message = "Drop city is required")
    private String dropCity;

    private String dropAddress;

    private String pickupDate;

    @NotNull(message = "Total amount is required")
    private Double totalAmount;
}