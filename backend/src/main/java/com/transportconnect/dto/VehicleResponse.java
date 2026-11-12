package com.transportconnect.dto;

import com.transportconnect.enums.VehicleStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class VehicleResponse {
    private Long id;
    private String registrationNumber;
    private String vehicleType;
    private Double capacityTons;
    private String currentCity;
    private String preferredRoutes;
    private Double pricePerKm;
    private String driverName;
    private String driverPhone;
    private Boolean gpsEnabled;
    private VehicleStatus status;
    private Long transporterId;
    private String transporterName;
    private String transporterCompany;
    private String transporterPhone;
    private LocalDateTime createdAt;
}