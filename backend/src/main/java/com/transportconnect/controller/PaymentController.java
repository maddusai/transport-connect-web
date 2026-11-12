package com.transportconnect.controller;

import com.transportconnect.entity.PaymentRecord;
import com.transportconnect.entity.User;
import com.transportconnect.repository.PaymentRecordRepository;
import com.transportconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentRecordRepository paymentRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> submitPayment(@RequestBody Map<String, Object> body, Authentication auth) {
        User customer = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        PaymentRecord record = PaymentRecord.builder()
                .customer(customer)
                .loadId(body.get("loadId") != null ? Long.valueOf(String.valueOf(body.get("loadId"))) : null)
                .bookingId(body.get("bookingId") != null ? Long.valueOf(String.valueOf(body.get("bookingId"))) : null)
                .amount(new BigDecimal(String.valueOf(body.getOrDefault("amount", "0"))))
                .transactionNumber(String.valueOf(body.get("transactionNumber")).toUpperCase())
                .slipFileName(String.valueOf(body.getOrDefault("slipFileName", "payment-slip.pdf")))
                .status("PENDING")
                .build();

        return ResponseEntity.ok(toDto(paymentRepository.save(record)));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyPayments(Authentication auth) {
        return ResponseEntity.ok(
                paymentRepository.findByCustomerEmailOrderBySubmittedAtDesc(auth.getName())
                        .stream().map(this::toDto).toList()
        );
    }

    @GetMapping
    public ResponseEntity<?> getAllPayments() {
        return ResponseEntity.ok(
                paymentRepository.findAllByOrderBySubmittedAtDesc()
                        .stream().map(this::toDto).toList()
        );
    }

    @PatchMapping("/{id}/verify")
    public ResponseEntity<?> verifyPayment(@PathVariable Long id, @RequestParam String status) {
        PaymentRecord record = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment record not found"));
        record.setStatus(status.toUpperCase());
        return ResponseEntity.ok(toDto(paymentRepository.save(record)));
    }

    private Map<String, Object> toDto(PaymentRecord p) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId());
        map.put("customerName", p.getCustomer().getName());
        map.put("loadId", p.getLoadId());
        map.put("bookingId", p.getBookingId());
        map.put("amount", p.getAmount());
        map.put("transactionNumber", p.getTransactionNumber());
        map.put("slipFileName", p.getSlipFileName());
        map.put("status", p.getStatus());
        map.put("submittedAt", p.getSubmittedAt());
        return map;
    }
}