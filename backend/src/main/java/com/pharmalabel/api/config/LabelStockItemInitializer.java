package com.pharmalabel.api.config;

import com.pharmalabel.api.models.LabelStock;
import com.pharmalabel.api.models.enums.LabelStockStatus;
import com.pharmalabel.api.repositories.LabelStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
public class LabelStockItemInitializer implements CommandLineRunner {

    private final LabelStockRepository labelStockRepository;

    @Override
    public void run(String... args) throws Exception {
        if (labelStockRepository.count() == 0) {
            log.info("Seeding predefined label stocks...");
            
            LabelStock bottle = LabelStock.builder()
                .name("Standard Bottle Label")
                .stockId("STK-BOTTLE-01")
                .description("80x120mm Glossy Finish High-Adhesion Bottle Label")
                .length(BigDecimal.valueOf(80.00))
                .breadth(BigDecimal.valueOf(120.00))
                .height(BigDecimal.valueOf(0.12))
                .quantityOnHand(BigDecimal.valueOf(10000))
                .reorderLevel(BigDecimal.valueOf(2500))
                .unitOfMeasure("ROLL")
                .status(LabelStockStatus.ACTIVE)
                .supplier("Global Print Solutions")
                .costCenter("WH-01")
                .build();
                
            LabelStock vial = LabelStock.builder()
                .name("Vial Wrap Label")
                .stockId("STK-VIAL-01")
                .description("55x35mm Transparent Poly-Wrap for clinical vials")
                .length(BigDecimal.valueOf(55.00))
                .breadth(BigDecimal.valueOf(35.00))
                .height(BigDecimal.valueOf(0.08))
                .quantityOnHand(BigDecimal.valueOf(50000))
                .reorderLevel(BigDecimal.valueOf(10000))
                .unitOfMeasure("ROLL")
                .status(LabelStockStatus.ACTIVE)
                .supplier("MediLabel Pharma")
                .costCenter("QC-LAB")
                .build();

            LabelStock blister = LabelStock.builder()
                .name("Blister Pack Foil")
                .stockId("STK-BLISTER-01")
                .description("110x70mm Foil backing for pharmaceutical blister packaging")
                .length(BigDecimal.valueOf(110.00))
                .breadth(BigDecimal.valueOf(70.00))
                .height(BigDecimal.valueOf(0.15))
                .quantityOnHand(BigDecimal.valueOf(25000))
                .reorderLevel(BigDecimal.valueOf(5000))
                .unitOfMeasure("PKT")
                .status(LabelStockStatus.ACTIVE)
                .supplier("AluBond Packaging")
                .costCenter("MFG-LINE-A")
                .build();

            LabelStock a5 = LabelStock.builder()
                .name("A5 Storage Label")
                .stockId("STK-A5-STD")
                .description("148x210mm Large Format Storage and Pallet labeling")
                .length(BigDecimal.valueOf(148.00))
                .breadth(BigDecimal.valueOf(210.00))
                .height(BigDecimal.valueOf(0.10))
                .quantityOnHand(BigDecimal.valueOf(5000))
                .reorderLevel(BigDecimal.valueOf(1000))
                .unitOfMeasure("SHEET")
                .status(LabelStockStatus.ACTIVE)
                .supplier("OfficeStream Corp")
                .costCenter("LOGISTICS")
                .build();

            LabelStock a4 = LabelStock.builder()
                .name("A4 Documentation Sheet")
                .stockId("STK-A4-STD")
                .description("210x297mm Standard A4 labeling for compliance documentation")
                .length(BigDecimal.valueOf(210.00))
                .breadth(BigDecimal.valueOf(297.00))
                .height(BigDecimal.valueOf(0.10))
                .quantityOnHand(BigDecimal.valueOf(2000))
                .reorderLevel(BigDecimal.valueOf(500))
                .unitOfMeasure("SHEET")
                .status(LabelStockStatus.ACTIVE)
                .supplier("OfficeStream Corp")
                .costCenter("ADMIN-01")
                .build();

            labelStockRepository.saveAll(Arrays.asList(bottle, vial, blister, a5, a4));
            log.info("Predefined label stocks seeded successfully.");
        }
    }
}
