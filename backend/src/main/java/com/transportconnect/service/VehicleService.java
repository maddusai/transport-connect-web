package com.transportconnect.service;

import com.transportconnect.dto.VehicleRequest;
import com.transportconnect.dto.VehicleResponse;
import com.transportconnect.entity.User;
import com.transportconnect.entity.Vehicle;
import com.transportconnect.enums.VehicleStatus;
import com.transportconnect.repository.UserRepository;
import com.transportconnect.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public VehicleResponse addVehicle(VehicleRequest request, String transporterEmail) {
        if (vehicleRepository.existsByRegistrationNumber(request.getRegistrationNumber().toUpperCase())) {
            throw new RuntimeException("Vehicle with this registration number already exists");
        }

        User transporter = userRepository.findByEmail(transporterEmail)
                .orElseThrow(() -> new RuntimeException("Transporter not found"));

        Vehicle vehicle = Vehicle.builder()
                .registrationNumber(request.getRegistrationNumber().toUpperCase())
                .vehicleType(request.getVehicleType())
                .capacityTons(request.getCapacityTons())
                .currentCity(request.getCurrentCity())
                .preferredRoutes(request.getPreferredRoutes())
                .pricePerKm(request.getPricePerKm())
                .driverName(request.getDriverName())
                .driverPhone(request.getDriverPhone())
                .gpsEnabled(request.getGpsEnabled() != null ? request.getGpsEnabled() : true)
                .status(VehicleStatus.AVAILABLE)
                .transporter(transporter)
                .build();

        return mapToResponse(vehicleRepository.save(vehicle));
    }

    public List<VehicleResponse> getAllAvailableVehicles(String city) {
        List<Vehicle> vehicles = (city != null && !city.isBlank())
                ? vehicleRepository.findByCurrentCityIgnoreCaseAndStatus(city, VehicleStatus.AVAILABLE)
                : vehicleRepository.findByStatusOrderByCreatedAtDesc(VehicleStatus.AVAILABLE);

        return vehicles.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<VehicleResponse> getMyVehicles(String transporterEmail) {
        User transporter = userRepository.findByEmail(transporterEmail)
                .orElseThrow(() -> new RuntimeException("Transporter not found"));

        return vehicleRepository.findByTransporterIdOrderByCreatedAtDesc(transporter.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public VehicleResponse updateStatus(Long vehicleId, VehicleStatus status, String transporterEmail) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (!vehicle.getTransporter().getEmail().equals(transporterEmail)) {
            throw new RuntimeException("Unauthorized to update this vehicle");
        }

        vehicle.setStatus(status);
        return mapToResponse(vehicleRepository.save(vehicle));
    }

    private VehicleResponse mapToResponse(Vehicle v) {
        return VehicleResponse.builder()
                .id(v.getId())
                .registrationNumber(v.getRegistrationNumber())
                .vehicleType(v.getVehicleType())
                .capacityTons(v.getCapacityTons())
                .currentCity(v.getCurrentCity())
                .preferredRoutes(v.getPreferredRoutes())
                .pricePerKm(v.getPricePerKm())
                .driverName(v.getDriverName())
                .driverPhone(v.getDriverPhone())
                .gpsEnabled(v.getGpsEnabled())
                .status(v.getStatus())
                .transporterId(v.getTransporter().getId())
                .transporterName(v.getTransporter().getName())
                .transporterCompany(v.getTransporter().getCompanyName())
                .transporterPhone(v.getTransporter().getPhone())
                .createdAt(v.getCreatedAt())
                .build();
    }
}