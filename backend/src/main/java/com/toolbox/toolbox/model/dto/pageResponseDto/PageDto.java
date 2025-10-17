package com.toolbox.toolbox.model.dto.pageResponseDto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Schema(description = "Structure paginée générique")
public class PageDto<T> {
    @Schema(description = "Contenu de la page")
    private List<T> content;

    @Schema(description = "Numéro de la page courante (0 = première page)")
    private int number;

    @Schema(description = "Taille de la page")
    private int size;

    @Schema(description = "Nombre total d'éléments")
    private long totalElements;

    @Schema(description = "Nombre total de pages")
    private int totalPages;

    @Schema(description = "Indique s'il s'agit de la dernière page")
    private boolean last;

    @Schema(description = "Indique s'il s'agit de la première page")
    private boolean first;

    @Schema(description = "Page vide ou non")
    private boolean empty;
}