package com.transportconnect.entity;

import com.transportconnect.enums.VehicleStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String registrationNumber;

    @Column(nullable = false)
    private String vehicleType; // e.g., Tata Ace, 14ft Eicher, 32ft Multi-Axle, Container

    @Column(nullable = false)
    private Double capacityTons;

    @Column(nullable = false)
    private String currentCity;

    private String preferredRoutes;

    @Column(nullable = false)
    private Double pricePerKm;

    private String driverName;

    private String driverPhone;

    private Boolean gpsEnabled = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleStatus status = VehicleStatus.AVAILABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transporter_id", nullable = false)
    private User transporter;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}