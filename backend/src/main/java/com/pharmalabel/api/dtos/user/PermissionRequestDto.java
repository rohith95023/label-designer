package com.pharmalabel.api.dtos.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionRequestDto {
    private String module;
    private String event;
    private Boolean allowed;
}
