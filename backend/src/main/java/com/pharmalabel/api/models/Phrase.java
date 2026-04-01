package com.pharmalabel.api.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Entity
@Table(name = "phrases")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Phrase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "phrase_key", nullable = false, unique = true)
    private String phraseKey;

    @Column(name = "default_text")
    private String defaultText;
}
