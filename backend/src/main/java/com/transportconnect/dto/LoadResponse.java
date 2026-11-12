package com.transportconnect.dto;

import com.transportconnect.enums.LoadStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class LoadResponse {
    private Long id;
    private String title;
    private String materialType;
    private Double weightTons;
    private String pickupCity;
    private String pickupAddress;
    private String dropCity;
    private String dropAddress;
    private String requiredVehicleType;
    private Double offeredPrice;
    private String pickupDate;
    private String notes;
    private LoadStatus status;
    private Long customerId;
    private String customerName;
    private String customerCompany;
    private String customerPhone;
    private Long assignedTransporterId;
    private String assignedTransporterName;
    private LocalDateTime createdAt;
}