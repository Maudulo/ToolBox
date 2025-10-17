package com.toolbox.toolbox.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.toolbox.toolbox.utils.ResponseBuilder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final AccessDenialContext denialContext;
    private final ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json");

        String message = denialContext.getMessage();
        if (message == null || message.isBlank()) {
            message = "Accès refusé : vous n’avez pas les droits pour cette action.";
        }

        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL); // optionnel
        response.getWriter().write(
                objectMapper.writeValueAsString(
                        ResponseBuilder.error(message, HttpStatus.FORBIDDEN)
                )
        );

        denialContext.clear();
    }
}