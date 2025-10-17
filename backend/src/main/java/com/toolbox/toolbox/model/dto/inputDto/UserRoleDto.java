package com.toolbox.toolbox.model.dto.inputDto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleDto {
    @NotNull(message = "User ID is mandatory")
    @Positive(message = "User ID must be a positive number")
    private Long userId;

    @NotBlank(message = "Role is mandatory")
    private String name;
}
