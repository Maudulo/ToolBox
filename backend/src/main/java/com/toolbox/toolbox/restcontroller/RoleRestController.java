package com.toolbox.toolbox.restcontroller;

import com.toolbox.toolbox.model.dto.ErrorResponseDoc;
import com.toolbox.toolbox.model.entity.Role;
import com.toolbox.toolbox.service.role.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/role")
@Tag(name = "Role", description = "")
public class RoleRestController {
    private final RoleService roleService;

    @GetMapping("")
    @Operation(summary = "Retourne la liste des roles")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Collection complète de la ressource", content = {
                    @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = Role.class)))
            }),
            @ApiResponse(responseCode = "400", description = "Bad request", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            })
    })
    public ResponseEntity<?> getAllRole(
    ) {
        List<Role> roleList = roleService.getAllItems();
        return ResponseEntity.ok(roleList);
    }
}