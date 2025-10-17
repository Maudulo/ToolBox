package com.toolbox.toolbox.config;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import com.toolbox.toolbox.component.VariableComponent;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;

@org.springframework.context.annotation.Configuration
@RequiredArgsConstructor
public class SocketConfig {
    private final VariableComponent variableComponent;

    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname(variableComponent.getSocketHost());
        config.setPort(variableComponent.getSocketPort());
        return new SocketIOServer(config);
    }

    @Bean
    public CommandLineRunner runner(SocketIOServer server) {
        return args -> {
            server.start();
            Runtime.getRuntime().addShutdownHook(new Thread(server::stop));
        };
    }
}
