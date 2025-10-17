package com.toolbox.toolbox.utils;

import com.toolbox.toolbox.model.dto.ErrorResponseDoc;
import com.toolbox.toolbox.model.dto.SuccessResponseDoc;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;

public class ResponseBuilder {
    public static ResponseEntity<SuccessResponseDoc> success(String message) {
        return success(message, null);
    }

    public static ResponseEntity<SuccessResponseDoc> success(String message, Object data) {
        SuccessResponseDoc response = new SuccessResponseDoc();
        response.setStatus(HttpStatus.OK.value());
        response.setSuccess(HttpStatus.OK.getReasonPhrase());
        response.setMessage(message);
        response.setTimestamp(Instant.now().toString());

        return ResponseEntity.ok(response);
        // return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    public static ResponseEntity<ErrorResponseDoc> error(String message) {
        return error(message, HttpStatus.BAD_REQUEST);
    }

    public static ResponseEntity<ErrorResponseDoc> error(String message, HttpStatus httpStatus) {
        ErrorResponseDoc response = new ErrorResponseDoc();

        response.setStatus(httpStatus.value());
        response.setError(httpStatus.getReasonPhrase());
        response.setMessage(message);
        response.setTimestamp(Instant.now().toString());

        return ResponseEntity.ok(response);
        // return ResponseEntity.status(httpStatus).body(response);
    }
}
