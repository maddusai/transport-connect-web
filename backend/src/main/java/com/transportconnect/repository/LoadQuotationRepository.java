package com.transportconnect.repository;

import com.transportconnect.entity.LoadQuotation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoadQuotationRepository extends JpaRepository<LoadQuotation, Long> {
    List<LoadQuotation> findByLoadIdOrderByCreatedAtDesc(Long loadId);
    List<LoadQuotation> findByTransporterEmailOrderByCreatedAtDesc(String email);
    List<LoadQuotation> findByLoadCustomerEmailOrderByCreatedAtDesc(String email);
}