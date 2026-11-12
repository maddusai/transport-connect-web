package com.transportconnect.service;

import com.transportconnect.dto.LoadRequest;
import com.transportconnect.dto.LoadResponse;
import com.transportconnect.entity.FreightLoad;
import com.transportconnect.entity.User;
import com.transportconnect.enums.LoadStatus;
import com.transportconnect.repository.FreightLoadRepository;
import com.transportconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FreightLoadService {

    private final FreightLoadRepository loadRepository;
    private final UserRepository userRepository;

    public LoadResponse createLoad(LoadRequest request, String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        FreightLoad load = FreightLoad.builder()
                .title(request.getTitle())
                .materialType(request.getMaterialType())
                .weightTons(request.getWeightTons())
                .pickupCity(request.getPickupCity())
                .pickupAddress(request.getPickupAddress())
                .dropCity(request.getDropCity())
                .dropAddress(request.getDropAddress())
                .requiredVehicleType(request.getRequiredVehicleType())
                .offeredPrice(request.getOfferedPrice())
                .pickupDate(request.getPickupDate())
                .notes(request.getNotes())
                .status(LoadStatus.OPEN)
                .customer(customer)
                .build();

        return mapToResponse(loadRepository.save(load));
    }

    public List<LoadResponse> getOpenLoads(String pickupCity, String dropCity) {
        List<FreightLoad> loads = (pickupCity != null && !pickupCity.isBlank() && dropCity != null && !dropCity.isBlank())
                ? loadRepository.findByPickupCityIgnoreCaseAndDropCityIgnoreCaseAndStatus(pickupCity, dropCity, LoadStatus.OPEN)
                : loadRepository.findByStatusOrderByCreatedAtDesc(LoadStatus.OPEN);

        return loads.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<LoadResponse> getMyPostedLoads(String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        return loadRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public LoadResponse acceptLoad(Long loadId, String transporterEmail) {
        FreightLoad load = loadRepository.findById(loadId)
                .orElseThrow(() -> new RuntimeException("Load not found"));

        if (load.getStatus() != LoadStatus.OPEN) {
            throw new RuntimeException("Load is no longer available");
        }

        User transporter = userRepository.findByEmail(transporterEmail)
                .orElseThrow(() -> new RuntimeException("Transporter not found"));

        load.setAssignedTransporter(transporter);
        load.setStatus(LoadStatus.ASSIGNED);

        return mapToResponse(loadRepository.save(load));
    }

    public LoadResponse updateLoadStatus(Long loadId, LoadStatus status) {
        FreightLoad load = loadRepository.findById(loadId)
                .orElseThrow(() -> new RuntimeException("Load not found"));

        load.setStatus(status);
        return mapToResponse(loadRepository.save(load));
    }

    private LoadResponse mapToResponse(FreightLoad l) {
        return LoadResponse.builder()
                .id(l.getId())
                .title(l.getTitle())
                .materialType(l.getMaterialType())
                .weightTons(l.getWeightTons())
                .pickupCity(l.getPickupCity())
                .pickupAddress(l.getPickupAddress())
                .dropCity(l.getDropCity())
                .dropAddress(l.getDropAddress())
                .requiredVehicleType(l.getRequiredVehicleType())
                .offeredPrice(l.getOfferedPrice())
                .pickupDate(l.getPickupDate())
                .notes(l.getNotes())
                .status(l.getStatus())
                .customerId(l.getCustomer().getId())
                .customerName(l.getCustomer().getName())
                .customerCompany(l.getCustomer().getCompanyName())
                .customerPhone(l.getCustomer().getPhone())
                .assignedTransporterId(l.getAssignedTransporter() != null ? l.getAssignedTransporter().getId() : null)
                .assignedTransporterName(l.getAssignedTransporter() != null ? l.getAssignedTransporter().getName() : null)
                .createdAt(l.getCreatedAt())
                .build();
    }
}