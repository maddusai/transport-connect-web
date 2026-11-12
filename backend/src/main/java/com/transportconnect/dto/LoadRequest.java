package com.transportconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LoadRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Material type is required")
    private String materialType;

    @NotNull(message = "Weight in tons is required")
    private Double weightTons;

    @NotBlank(message = "Pickup city is required")
    private String pickupCity;

    private String pickupAddress;

    @NotBlank(message = "Drop city is required")
    private String dropCity;

    private String dropAddress;

    @NotBlank(message = "Required vehicle type is required")
    private String requiredVehicleType;

    @NotNull(message = "Offered price is required")
    private Double offeredPrice;

    private String pickupDate;
    private String notes;
}