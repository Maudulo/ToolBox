package com.toolbox.toolbox.component;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VariableComponent {
    @Getter
    @Value("${app.socket.server.host}")
    private String socketHost;

    @Getter
    @Value("${app.socket.server.port}")
    private int socketPort;
}
