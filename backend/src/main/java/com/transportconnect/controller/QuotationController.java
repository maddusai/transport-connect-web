package com.transportconnect.controller;

import com.transportconnect.entity.FreightLoad;
import com.transportconnect.entity.LoadQuotation;
import com.transportconnect.entity.User;
import com.transportconnect.enums.LoadStatus;
import com.transportconnect.repository.FreightLoadRepository;
import com.transportconnect.repository.LoadQuotationRepository;
import com.transportconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quotations")
@RequiredArgsConstructor
public class QuotationController {

    private final LoadQuotationRepository quotationRepository;
    private final FreightLoadRepository loadRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> submitQuotation(@RequestBody Map<String, Object> body, Authentication auth) {
        User transporter = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long loadId = Long.valueOf(String.valueOf(body.get("loadId")));
        FreightLoad load = loadRepository.findById(loadId)
                .orElseThrow(() -> new RuntimeException("Load not found"));

        LoadQuotation quotation = LoadQuotation.builder()
                .load(load)
                .transporter(transporter)
                .truckNumber(String.valueOf(body.getOrDefault("truckNumber", "")))
                .offeredAmount(new BigDecimal(String.valueOf(body.get("offeredAmount"))))
                .etaDays(String.valueOf(body.getOrDefault("etaDays", "2 Days")))
                .notes(body.get("notes") != null ? String.valueOf(body.get("notes")) : null)
                .status("PENDING")
                .build();

        return ResponseEntity.ok(toDto(quotationRepository.save(quotation)));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyQuotations(Authentication auth) {
        List<LoadQuotation> asTransporter = quotationRepository.findByTransporterEmailOrderByCreatedAtDesc(auth.getName());
        if (!asTransporter.isEmpty()) {
            return ResponseEntity.ok(asTransporter.stream().map(this::toDto).toList());
        }
        return ResponseEntity.ok(
                quotationRepository.findByLoadCustomerEmailOrderByCreatedAtDesc(auth.getName())
                        .stream().map(this::toDto).toList()
        );
    }

    @GetMapping("/load/{loadId}")
    public ResponseEntity<?> getByLoad(@PathVariable Long loadId) {
        return ResponseEntity.ok(
                quotationRepository.findByLoadIdOrderByCreatedAtDesc(loadId)
                        .stream().map(this::toDto).toList()
        );
    }

    @PatchMapping("/{id}/decision")
    public ResponseEntity<?> decideQuotation(@PathVariable Long id, @RequestParam String status) {
        LoadQuotation target = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quotation not found"));
        String normalized = status.toUpperCase();
        target.setStatus(normalized);
        quotationRepository.save(target);

        if ("ACCEPTED".equals(normalized)) {
            FreightLoad load = target.getLoad();
            load.setStatus(LoadStatus.ASSIGNED);
            load.setOfferedPrice(target.getOfferedAmount().doubleValue());
            loadRepository.save(load);

            quotationRepository.findByLoadIdOrderByCreatedAtDesc(load.getId()).forEach(other -> {
                if (!other.getId().equals(target.getId()) && "PENDING".equals(other.getStatus())) {
                    other.setStatus("REJECTED");
                    quotationRepository.save(other);
                }
            });
        }
        return ResponseEntity.ok(toDto(target));
    }

    private Map<String, Object> toDto(LoadQuotation q) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", q.getId());
        map.put("loadId", q.getLoad().getId());
        map.put("from", q.getLoad().getPickupCity());
        map.put("to", q.getLoad().getDropCity());
        map.put("vehicleType", q.getLoad().getRequiredVehicleType());
        map.put("truckOwner", q.getTransporter().getCompanyName() != null ? q.getTransporter().getCompanyName() : q.getTransporter().getName());
        map.put("truckNumber", q.getTruckNumber());
        map.put("amount", q.getOfferedAmount());
        map.put("etaDays", q.getEtaDays());
        map.put("notes", q.getNotes());
        map.put("status", q.getStatus());
        map.put("submittedAt", q.getCreatedAt());
        return map;
    }
}