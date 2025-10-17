package com.toolbox.toolbox.restcontroller;

import com.toolbox.toolbox.component.SocketIOComponent;
import com.toolbox.toolbox.model.enumproperty.SocketMessageType;
import com.toolbox.toolbox.service.auth.AuthService;
import com.toolbox.toolbox.utils.ResponseBuilder;
import io.jsonwebtoken.Claims;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/debug")
@Tag(name = "Debug", description = "")
public class DebugRestController {
    private final AuthService authService;
    //private final SocketIOComponent socket;

    @GetMapping("/token")
    public ResponseEntity<?> getAuthToken() {
        String token = authService.getCurrentJtwToken();
        Claims claims = authService.getClaimsFromToken(token);
        return ResponseEntity.ok(claims);
    }

    /*@GetMapping("/socket")
    @Operation(description = "Depuis un front, être dans la salon 'debug'")
    public ResponseEntity<?> setSocketMessage(
            @RequestParam(required = true) String roomName,
            @RequestParam(required = true) @Parameter(
                    array = @ArraySchema(schema = @Schema(allowableValues = {
                            "delete","deleteBy","update","message","notification"
                    }))
            ) List<String> messageTypes,
            @RequestParam(required = true) String message
    ) {
        List<SocketMessageType> messageTypeList = (messageTypes != null)
                ? messageTypes.stream()
                .map(SocketMessageType::fromLabel)
                .collect(Collectors.toList())
                : Collections.emptyList();
        try {
            //if (messageTypeList.contains(SocketMessageType.DELETE))
            //    socket.onMessageRoomSent(roomName, "roomMessage", null, SocketMessageType.DELETE);

            //if (messageTypeList.contains(SocketMessageType.DELETE_BY))
            //    socket.onMessageRoomSent(roomName, "roomMessage", null, SocketMessageType.DELETE_BY);

            if (messageTypeList.contains(SocketMessageType.UPDATE))
                socket.onMessageRoomSent(roomName, "roomMessage", null, SocketMessageType.UPDATE);

            if (messageTypeList.contains(SocketMessageType.NOTIFY))
                socket.onMessageRoomSent(roomName, "roomMessage", message, SocketMessageType.NOTIFY);

            if (messageTypeList.contains(SocketMessageType.MESSAGE))
                socket.onMessageRoomSent(roomName, "roomMessage", message, SocketMessageType.MESSAGE);

            return ResponseBuilder.success(String.valueOf(HttpStatus.OK));
        } catch (Exception e) {
            return ResponseBuilder.error(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }*/
}
