package com.toolbox.toolbox.model.dto.inputDto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class UserResetDto {
    @NotBlank(message = "Pass is mandatory")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{10,}$",
            message = "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre, un caractère spécial et être d'au moins 10 caractères."
    )
    private String pass;
}
