package com.toolbox.toolbox.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(name = "ErrorResponse", description = "Structure standard des erreurs")
public class ErrorResponseDoc {
    @Schema(description = "Code HTTP", example = "400")
    private int status;

    @Schema(description = "Type d'erreur HTTP", example = "Bad Request")
    private String error;

    @Schema(description = "Message d'erreur", example = "Le champ 'email' est obligatoire")
    private String message;

    @Schema(description = "Horodatage de l'erreur", example = "2025-06-04T12:34:56Z")
    private String timestamp;
}