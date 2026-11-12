package com.transportconnect.service;

import com.transportconnect.dto.BookingRequest;
import com.transportconnect.dto.BookingResponse;
import com.transportconnect.dto.GpsLocationUpdateRequest;
import com.transportconnect.entity.*;
import com.transportconnect.enums.BookingStatus;
import com.transportconnect.enums.LoadStatus;
import com.transportconnect.enums.Role;
import com.transportconnect.enums.VehicleStatus;
import com.transportconnect.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final FreightLoadRepository loadRepository;

    @Transactional
    public BookingResponse createBooking(BookingRequest request, String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            throw new RuntimeException("Selected vehicle is not currently available");
        }

        FreightLoad load = null;
        if (request.getLoadId() != null) {
            load = loadRepository.findById(request.getLoadId())
                    .orElseThrow(() -> new RuntimeException("Freight load not found"));
            load.setAssignedTransporter(vehicle.getTransporter());
            load.setStatus(LoadStatus.ASSIGNED);
            loadRepository.save(load);
        }

        vehicle.setStatus(VehicleStatus.BOOKED);
        vehicleRepository.save(vehicle);

        String code = "TC-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        Booking booking = Booking.builder()
                .bookingCode(code)
                .customer(customer)
                .transporter(vehicle.getTransporter())
                .vehicle(vehicle)
                .freightLoad(load)
                .pickupCity(request.getPickupCity())
                .pickupAddress(request.getPickupAddress())
                .dropCity(request.getDropCity())
                .dropAddress(request.getDropAddress())
                .pickupDate(request.getPickupDate())
                .totalAmount(request.getTotalAmount())
                .status(BookingStatus.PENDING)
                .currentLatitude(17.3850) // Default Hyderabad hub coordinates until live update
                .currentLongitude(78.4867)
                .currentLocationLabel(request.getPickupCity() + " Dispatch Hub")
                .speedKmph(0.0)
                .progressPercent(0)
                .build();

        return mapToResponse(bookingRepository.save(booking));
    }

    public List<BookingResponse> getMyBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Booking> bookings = (user.getRole() == Role.TRANSPORTER)
                ? bookingRepository.findByTransporterIdOrderByCreatedAtDesc(user.getId())
                : bookingRepository.findByCustomerIdOrderByCreatedAtDesc(user.getId());

        return bookings.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public BookingResponse getBookingById(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return mapToResponse(booking);
    }

    @Transactional
    public BookingResponse updateBookingStatus(Long bookingId, BookingStatus status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(status);

        // Sync vehicle and load statuses automatically
        Vehicle vehicle = booking.getVehicle();
        FreightLoad load = booking.getFreightLoad();

        if (status == BookingStatus.IN_TRANSIT) {
            vehicle.setStatus(VehicleStatus.IN_TRANSIT);
            if (load != null) load.setStatus(LoadStatus.IN_TRANSIT);
        } else if (status == BookingStatus.COMPLETED) {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            booking.setProgressPercent(100);
            booking.setSpeedKmph(0.0);
            if (load != null) load.setStatus(LoadStatus.DELIVERED);
        } else if (status == BookingStatus.CANCELLED) {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            if (load != null) {
                load.setStatus(LoadStatus.OPEN);
                load.setAssignedTransporter(null);
            }
        }

        vehicleRepository.save(vehicle);
        if (load != null) loadRepository.save(load);

        return mapToResponse(bookingRepository.save(booking));
    }

    public BookingResponse updateLiveLocation(Long bookingId, GpsLocationUpdateRequest gpsRequest) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setCurrentLatitude(gpsRequest.getLatitude());
        booking.setCurrentLongitude(gpsRequest.getLongitude());
        if (gpsRequest.getLocationLabel() != null) booking.setCurrentLocationLabel(gpsRequest.getLocationLabel());
        if (gpsRequest.getSpeedKmph() != null) booking.setSpeedKmph(gpsRequest.getSpeedKmph());
        if (gpsRequest.getProgressPercent() != null) booking.setProgressPercent(gpsRequest.getProgressPercent());
        if (gpsRequest.getEstimatedArrival() != null) booking.setEstimatedArrival(gpsRequest.getEstimatedArrival());

        return mapToResponse(bookingRepository.save(booking));
    }

    private BookingResponse mapToResponse(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .bookingCode(b.getBookingCode())
                .customerId(b.getCustomer().getId())
                .customerName(b.getCustomer().getName())
                .customerPhone(b.getCustomer().getPhone())
                .transporterId(b.getTransporter().getId())
                .transporterName(b.getTransporter().getName())
                .transporterCompany(b.getTransporter().getCompanyName())
                .transporterPhone(b.getTransporter().getPhone())
                .vehicleId(b.getVehicle().getId())
                .vehicleRegistration(b.getVehicle().getRegistrationNumber())
                .vehicleType(b.getVehicle().getVehicleType())
                .driverName(b.getVehicle().getDriverName())
                .driverPhone(b.getVehicle().getDriverPhone())
                .loadId(b.getFreightLoad() != null ? b.getFreightLoad().getId() : null)
                .pickupCity(b.getPickupCity())
                .pickupAddress(b.getPickupAddress())
                .dropCity(b.getDropCity())
                .dropAddress(b.getDropAddress())
                .pickupDate(b.getPickupDate())
                .totalAmount(b.getTotalAmount())
                .status(b.getStatus())
                .currentLatitude(b.getCurrentLatitude())
                .currentLongitude(b.getCurrentLongitude())
                .currentLocationLabel(b.getCurrentLocationLabel())
                .speedKmph(b.getSpeedKmph())
                .progressPercent(b.getProgressPercent())
                .estimatedArrival(b.getEstimatedArrival())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}