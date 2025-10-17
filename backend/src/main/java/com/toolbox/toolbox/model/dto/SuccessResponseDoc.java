package com.toolbox.toolbox.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(name = "SuccessResponse", description = "Structure standard des réponses réussies")
public class SuccessResponseDoc {
    @Schema(description = "Code HTTP", example = "200")
    private int status;

    @Schema(description = "Type de succès HTTP", example = "OK")
    private String success;

    @Schema(description = "Message de succès", example = "Requête traitée avec succès")
    private String message;

    @Schema(description = "Horodatage de la réponse", example = "2025-06-04T12:34:56Z")
    private String timestamp;
}

