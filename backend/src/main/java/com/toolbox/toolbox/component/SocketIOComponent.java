package com.toolbox.toolbox.component;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.toolbox.toolbox.model.dto.inputDto.SocketMessageDto;
import com.toolbox.toolbox.model.enumproperty.SocketMessageType;
import org.springframework.stereotype.Component;

@Component
public class SocketIOComponent {
    private final SocketIOServer server;
    private final ObjectMapper objectMapper;

    public SocketIOComponent(SocketIOServer server, ObjectMapper objectMapper) {
        this.server = server;
        this.objectMapper = objectMapper;
        this.init();
    }

    private void init() {
        server.addConnectListener(onConnected());
        server.addDisconnectListener(onDisconnected());

        // Exemple pour un écouteur d'événements
        server.addEventListener("message", String.class, onMessageReceived());

        // Ajout des écouteurs pour rejoindre et quitter une salle
        server.addEventListener("joinRoom", String.class, onRoomJoin());
        server.addEventListener("leaveRoom", String.class, onRoomLeave());

        // Exemple pour un écouteur d'événements pour une room spécifique
        server.addEventListener("roomMessage", SocketMessageDto.class, onMessageRoomReceived());
    }

    // connexion / déconnexion
    private ConnectListener onConnected() {
        return client -> {
            String sessionId = client.getSessionId().toString();
            System.out.println("Client connected: " + sessionId);
            // logique de connexion ici
        };
    }
    private DisconnectListener onDisconnected() {
        return client -> {
            String sessionId = client.getSessionId().toString();
            System.out.println("Client disconnected: " + sessionId);
            // logique de déconnexion ici
        };
    }

    // Rejoindre / Quitter un salon
    private DataListener<String> onRoomJoin() {
        return (client, room, ackSender) -> {
            client.joinRoom(room);
            this.onMessageSent(client,"roomEvent", "Joined room " + room);
            //System.out.println("Client " + client.getSessionId() + " joined room " + room);
        };
    }
    private DataListener<String> onRoomLeave() {
        return (client, room, ackSender) -> {
            client.leaveRoom(room);
            this.onMessageSent(client,"roomEvent", "Left room " + room);
            //System.out.println("Client " + client.getSessionId() + " left room " + room);
        };
    }

    // Envoyer / Recevoir un message
    private void onMessageSent(SocketIOClient client, String channel, Object... objects) {
        client.sendEvent(channel, objects);
    }
    private DataListener<String> onMessageReceived() {
        return (client, data, ackSender) -> {
            this.onMessageSent(client,"ack", "Message reçu avec succès");
            System.out.println("Message reçus (n° client: " + client.getSessionId().toString() + ") : " + data);
        };
    }

    // Envoyer / Recevoir un message depuis un salon
    public <T> void onMessageRoomSent(String room, String event, T message, SocketMessageType type) {
        System.out.println("Room (" + room + ") message sent: " + type);
        Object obj = new Object[]{type.getLabel(), message};
        server.getRoomOperations(room).sendEvent(event, obj);
    }
    private DataListener<SocketMessageDto> onMessageRoomReceived() {
        return (client, data, ackSender) -> {
            this.onMessageRoomSent(data.getRoom(), "roomMessage", data.getMessage(), SocketMessageType.MESSAGE);
            //System.out.println("Room message received: " + data);
            // Traitez le message reçu ici
        };
    }
}
