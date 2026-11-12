package com.transportconnect.repository;

import com.transportconnect.entity.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {
    List<PaymentRecord> findByCustomerEmailOrderBySubmittedAtDesc(String email);
    List<PaymentRecord> findAllByOrderBySubmittedAtDesc();
}