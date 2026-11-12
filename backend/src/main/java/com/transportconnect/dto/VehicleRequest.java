package com.transportconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VehicleRequest {
    @NotBlank(message = "Registration number is required")
    private String registrationNumber;

    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;

    @NotNull(message = "Capacity in tons is required")
    private Double capacityTons;

    @NotBlank(message = "Current city is required")
    private String currentCity;

    private String preferredRoutes;

    @NotNull(message = "Price per km is required")
    private Double pricePerKm;

    private String driverName;
    private String driverPhone;
    private Boolean gpsEnabled = true;
}