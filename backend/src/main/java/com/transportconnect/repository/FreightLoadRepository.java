package com.transportconnect.repository;

import com.transportconnect.entity.FreightLoad;
import com.transportconnect.enums.LoadStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FreightLoadRepository extends JpaRepository<FreightLoad, Long> {
    List<FreightLoad> findByStatusOrderByCreatedAtDesc(LoadStatus status);
    List<FreightLoad> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<FreightLoad> findByAssignedTransporterIdOrderByCreatedAtDesc(Long transporterId);
    List<FreightLoad> findByPickupCityIgnoreCaseAndDropCityIgnoreCaseAndStatus(String pickupCity, String dropCity, LoadStatus status);
}