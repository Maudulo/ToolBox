package com.toolbox.toolbox.model.dto.paramDto;

import jakarta.validation.constraints.Max;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class UserParamDto {
    private String sort;

    @Max(value = 100, message = "Limit must be at most 100")
    private Long limit;

    private Integer page;

    private String role;

    private String email;

    private String username;

    private Boolean enabled;

    private Boolean locked;

    public UserParamDto(String sort, Long limit, Integer page) {
        this.sort = sort;
        this.limit = limit;
        this.page = page;
    }

    public UserParamDto(String email, String username) {
        this.email = email;
        this.username = username;
    }
}