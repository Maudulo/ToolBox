package com.toolbox.toolbox.model.dto.authDto;

import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class AuthOutputDto {
    private String message;
    private String token;
}
