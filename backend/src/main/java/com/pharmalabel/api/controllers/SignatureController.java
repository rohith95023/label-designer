package com.pharmalabel.api.controllers;

import com.pharmalabel.api.dtos.signature.ElectronicSignatureRequest;
import com.pharmalabel.api.models.ElectronicSignature;
import com.pharmalabel.api.services.SignatureService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/signatures")
@RequiredArgsConstructor
public class SignatureController {

    private final SignatureService signatureService;

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("@securityService.hasAccess('SIGNATURES', 'CREATE')")
    public ResponseEntity<ElectronicSignature> sign(
            @Valid @RequestBody ElectronicSignatureRequest request,
            HttpServletRequest httpServletRequest
    ) {
        String ipAddress = httpServletRequest.getRemoteAddr();
        ElectronicSignature signed = signatureService.sign(request, ipAddress);
        return ResponseEntity.ok(signed);
    }
}
