package com.transportconnect.entity;

import com.transportconnect.enums.LoadStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "freight_loads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FreightLoad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String materialType; // e.g., Electronics, FMCG, Steel, Agriculture

    @Column(nullable = false)
    private Double weightTons;

    @Column(nullable = false)
    private String pickupCity;

    private String pickupAddress;

    @Column(nullable = false)
    private String dropCity;

    private String dropAddress;

    @Column(nullable = false)
    private String requiredVehicleType;

    @Column(nullable = false)
    private Double offeredPrice;

    private String pickupDate;

    @Column(length = 1000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoadStatus status = LoadStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_transporter_id")
    private User assignedTransporter;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}