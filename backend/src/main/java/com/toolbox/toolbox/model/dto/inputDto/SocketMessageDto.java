package com.toolbox.toolbox.model.dto.inputDto;

import com.toolbox.toolbox.model.enumproperty.SocketMessageType;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class SocketMessageDto {
    private String room;
    private String message;
    private SocketMessageType type;
}
