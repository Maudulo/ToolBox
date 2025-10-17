package com.toolbox.toolbox.exception;

import org.springframework.stereotype.Component;

@Component
public class AccessDenialContext {

    private static final ThreadLocal<String> denialReason = new ThreadLocal<>();

    public void setMessage(String message) {
        denialReason.set(message);
    }

    public String getMessage() {
        return denialReason.get();
    }

    public void clear() {
        denialReason.remove();
    }
}

