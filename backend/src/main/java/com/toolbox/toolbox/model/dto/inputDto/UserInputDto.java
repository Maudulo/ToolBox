package com.toolbox.toolbox.model.dto.inputDto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class UserInputDto {
    @NotBlank(message = "Email is mandatory")
    @Email(message = "Email should be valid")
    @Size(min = 5, max = 180, message = "Email must be between 5 and 180 characters")
    /*@Pattern(
            regexp = "^[a-zA-Z0-9.-]+@sii\\.fr$",
            message = "Email must be in the format: xxxxxxxx@sii.fr"
    )*/
    private String email;

    @NotBlank(message = "Username is mandatory")
    @Size(min = 2, max = 100, message = "Username must be between 2 and 100 characters")
    private String username;

    @NotBlank(message = "Password is mandatory")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{10,}$",
            message = "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre, un caractère spécial et être d'au moins 10 caractères."
    )
    private String password;
}
