package com.toolbox.toolbox.restcontroller;

import com.toolbox.toolbox.model.dto.ErrorResponseDoc;
import com.toolbox.toolbox.model.dto.authDto.AuthInputDto;
import com.toolbox.toolbox.model.dto.authDto.AuthOutputDto;
import com.toolbox.toolbox.model.entity.User;
import com.toolbox.toolbox.service.auth.AuthService;
import com.toolbox.toolbox.service.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/authentication")
@Tag(name = "Api", description = "")
public class JwtRestController {
    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    @Operation(summary = "Génération d'un nouveau jeton JWT")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Le jeton est créé", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = AuthOutputDto.class))
            }),
            @ApiResponse(responseCode = "400", description = "Bad request", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            }),
            @ApiResponse(responseCode = "404", description = "Not found", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            })
    })
    public ResponseEntity<?> login(@Valid @RequestBody AuthInputDto userLogin) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                userLogin.getEmail(),
                userLogin.getPassword()
        ));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = authService.generateToken(authentication);

        AuthOutputDto response = new AuthOutputDto("User logged in successfully", token);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Génération d'un nouveau jeton JWT")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Le jeton est créé", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = AuthOutputDto.class))
            }),
            @ApiResponse(responseCode = "400", description = "Bad request", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            }),
            @ApiResponse(responseCode = "404", description = "Not found", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            })
    })
    public ResponseEntity<?> refresh() {
        User auth = userService.getAuthenticatedUser();

        String token = authService.refreshToken(auth);

        AuthOutputDto response = new AuthOutputDto("New token generated", token);

        return ResponseEntity.ok(response);
    }
}