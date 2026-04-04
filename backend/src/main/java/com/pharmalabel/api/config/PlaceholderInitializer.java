package com.pharmalabel.api.config;

import com.pharmalabel.api.models.Placeholder;
import com.pharmalabel.api.repositories.PlaceholderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
public class PlaceholderInitializer implements CommandLineRunner {

    private final PlaceholderRepository placeholderRepository;

    @Override
    public void run(String... args) throws Exception {
        if (placeholderRepository.count() == 0) {
            log.info("Seeding predefined placeholders...");

            Placeholder protocol = Placeholder.builder()
                    .name("Protocol Number")
                    .type("DATA")
                    .mappingKey("PROTOCOL_NO")
                    .defaultValue("CL-2024-V91")
                    .description("Clinical Trial Protocol Number")
                    .build();

            Placeholder patient = Placeholder.builder()
                    .name("Patient ID")
                    .type("DATA")
                    .mappingKey("PATIENT_ID")
                    .defaultValue("P-882931")
                    .description("Unique Patient Identifier")
                    .build();

            Placeholder medication = Placeholder.builder()
                    .name("Medication")
                    .type("DATA")
                    .mappingKey("MEDICATION")
                    .defaultValue("Methylprednisolone IP")
                    .build();

            Placeholder strength = Placeholder.builder()
                    .name("Strength")
                    .type("DATA")
                    .mappingKey("STRENGTH")
                    .defaultValue("40 mg / mL")
                    .build();

            Placeholder dosage = Placeholder.builder()
                    .name("Dosage Form")
                    .type("DATA")
                    .mappingKey("DOSAGE")
                    .defaultValue("10 mL Injection")
                    .build();

            Placeholder expDate = Placeholder.builder()
                    .name("Expiry Date")
                    .type("RUNTIME")
                    .mappingKey("EXP_DATE")
                    .defaultValue("2027-02-15")
                    .build();

            Placeholder mfgDate = Placeholder.builder()
                    .name("Mfg Date")
                    .type("RUNTIME")
                    .mappingKey("MFG_DATE")
                    .defaultValue("2024-02-15")
                    .build();

            Placeholder batchNo = Placeholder.builder()
                    .name("Batch Number")
                    .type("RUNTIME")
                    .mappingKey("BATCH_NO")
                    .defaultValue("BATCH-XQ102")
                    .build();

            Placeholder sponsor = Placeholder.builder()
                    .name("Sponsor Name")
                    .type("DATA")
                    .mappingKey("SPONSOR")
                    .defaultValue("PharmaCore Solutions")
                    .build();

            placeholderRepository.saveAll(Arrays.asList(protocol, patient, medication, strength, dosage, expDate, mfgDate, batchNo, sponsor));
            log.info("Predefined placeholders seeded successfully.");
        }
    }
}
