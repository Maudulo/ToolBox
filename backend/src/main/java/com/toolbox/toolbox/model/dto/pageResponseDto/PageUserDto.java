package com.toolbox.toolbox.model.dto.pageResponseDto;

import com.toolbox.toolbox.model.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Page d'utilisateurs")
public class PageUserDto extends PageDto<User> {}
