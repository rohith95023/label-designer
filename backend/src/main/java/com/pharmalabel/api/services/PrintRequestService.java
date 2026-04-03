package com.pharmalabel.api.services;

import com.pharmalabel.api.models.PrintRequest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PrintRequestService {
    List<PrintRequest> getAllPrintRequests();
    List<PrintRequest> getMyPrintRequests();
    Optional<PrintRequest> getPrintRequestById(UUID id);
    PrintRequest createPrintRequest(PrintRequest printRequest);
    PrintRequest updatePrintRequestStatus(UUID id, String status);
}
