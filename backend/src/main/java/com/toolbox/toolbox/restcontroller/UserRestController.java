package com.toolbox.toolbox.restcontroller;

import com.toolbox.toolbox.model.dto.ErrorResponseDoc;
import com.toolbox.toolbox.model.dto.SuccessResponseDoc;
import com.toolbox.toolbox.model.dto.inputDto.UserInputDto;
import com.toolbox.toolbox.model.dto.inputDto.UserPatchDto;
import com.toolbox.toolbox.model.dto.inputDto.UserRoleDto;
import com.toolbox.toolbox.model.dto.pageResponseDto.PageUserDto;
import com.toolbox.toolbox.model.dto.paramDto.UserParamDto;
import com.toolbox.toolbox.model.entity.User;
import com.toolbox.toolbox.service.user.UserService;
import com.toolbox.toolbox.utils.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/user")
@Tag(name = "User", description = "")
public class UserRestController {
    private final UserService userService;

    @GetMapping("")
    @Operation(summary = "Retourne la liste des Utilisateurs")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Collection complète de la ressource", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = PageUserDto.class))
            }),
            @ApiResponse(responseCode = "400", description = "Bad request", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            })
    })
    public ResponseEntity<?> getAllUser(
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Long limit,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(required = false) Boolean locked
    ) {
        UserParamDto paramDto = new UserParamDto(sort, limit, page, role, email, username, enabled, locked);
        Page<User> userPage = userService.getFilteredItems(paramDto);
        return ResponseEntity.ok(userPage);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retourne les informations d'un Utilisateur")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Retourne les informations d'un Utilisateur", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))
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
    public ResponseEntity<?> getUserById(@PathVariable("id") Long id) {
        User user = userService.getOneItemById(id);
        return ResponseEntity.ok(user);
    }

    @PostMapping("")
    @Operation(summary = "Création d'un Utilisateur")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Utilisateur créé", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))
            }),
            @ApiResponse(responseCode = "400", description = "Bad request", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            }),
            @ApiResponse(responseCode = "404", description = "Not found", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            })
    })
    public ResponseEntity<?> createUser(@Valid @RequestBody UserInputDto userDto) {
        User user = userService.create(userDto);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(user.getId())
                .toUri();
        return ResponseEntity.created(location).body(user);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Modification d'un Utilisateur")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "L'Utilisateur est modifié", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))
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
    public ResponseEntity<?> updateUser(@PathVariable("id") Long id, @Valid @RequestBody UserPatchDto userDto) {
        User user = userService.update(id, userDto);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(user.getId())
                .toUri();
        return ResponseEntity.created(location).body(user);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Suppression d'un Utilisateur")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "L'Utilisateur est supprimé", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = SuccessResponseDoc.class))
            }),
            @ApiResponse(responseCode = "400", description = "Bad request", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            })
    })
    public ResponseEntity<?> deleteUser(@PathVariable("id") Long id) {
        userService.delete(id);
        return ResponseBuilder.success(
                String.format("Entité %s supprimé avec succés",
                        User.class.getSimpleName())
        );
    }

    @PatchMapping("/assign-role")
    @Operation(summary = "Assignation d'un rôle")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Rôle assigné", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = SuccessResponseDoc.class))
            }),
            @ApiResponse(responseCode = "400", description = "Bad request", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            }),
            @ApiResponse(responseCode = "404", description = "Not found", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            })
    })
    public ResponseEntity<?> AssignRole(@Valid @RequestBody UserRoleDto roleDto) {
        userService.assignRole(roleDto);
        return ResponseBuilder.success("Role assigné avec succès");
    }

    @PatchMapping("/remove-role")
    @Operation(summary = "Désaffectation d'un rôle")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Rôle retiré", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = SuccessResponseDoc.class))
            }),
            @ApiResponse(responseCode = "400", description = "Bad request", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            }),
            @ApiResponse(responseCode = "404", description = "Not found", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponseDoc.class))
            })
    })
    public ResponseEntity<?> RemoveRole(@Valid @RequestBody UserRoleDto roleDto) {
        userService.removeRole(roleDto);
        return ResponseBuilder.success("Role retiré avec succès");
    }
}
