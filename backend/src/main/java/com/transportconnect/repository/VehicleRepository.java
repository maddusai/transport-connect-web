package com.transportconnect.repository;

import com.transportconnect.entity.Vehicle;
import com.transportconnect.enums.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByStatusOrderByCreatedAtDesc(VehicleStatus status);
    List<Vehicle> findByTransporterIdOrderByCreatedAtDesc(Long transporterId);
    List<Vehicle> findByCurrentCityIgnoreCaseAndStatus(String currentCity, VehicleStatus status);
    boolean existsByRegistrationNumber(String registrationNumber);
}