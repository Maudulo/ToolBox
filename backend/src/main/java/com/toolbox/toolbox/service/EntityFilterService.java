package com.toolbox.toolbox.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

public interface EntityFilterService<E, P> {
    Page<E> getFilteredItems(P paramDto);

    Specification<E> build(P dto);

    Pageable toPageable(P dto);
}
