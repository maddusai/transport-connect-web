package com.transportconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    private Long loadId;

    private Long bookingId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String transactionNumber;

    private String slipFileName;

    @Column(nullable = false)
    private String status; // PENDING, VERIFIED, REJECTED

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime submittedAt;
}