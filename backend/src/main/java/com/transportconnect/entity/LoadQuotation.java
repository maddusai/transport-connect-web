package com.transportconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "load_quotations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoadQuotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "load_id", nullable = false)
    private FreightLoad load;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transporter_id", nullable = false)
    private User transporter;

    private String truckNumber;

    @Column(nullable = false)
    private BigDecimal offeredAmount;

    private String etaDays;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    private String status; // PENDING, ACCEPTED, REJECTED

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}