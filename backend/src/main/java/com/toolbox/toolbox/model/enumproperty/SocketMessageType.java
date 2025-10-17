package com.toolbox.toolbox.model.enumproperty;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

public enum SocketMessageType {
    DELETE("delete"),
    DELETE_BY("deleteBy"),
    UPDATE("update"),
    MESSAGE("message"),
    NOTIFY("notification");

    private final String label;

    SocketMessageType(String label) { this.label = label; }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static SocketMessageType fromLabel(String type) {
        return Arrays.stream(SocketMessageType.values())
                .filter(messageType -> messageType.label.equalsIgnoreCase(type))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown message type: " + type));
    }
}