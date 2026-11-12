package com.transportconnect.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GpsLocationUpdateRequest {
    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private String locationLabel;
    private Double speedKmph;
    private Integer progressPercent;
    private String estimatedArrival;
}