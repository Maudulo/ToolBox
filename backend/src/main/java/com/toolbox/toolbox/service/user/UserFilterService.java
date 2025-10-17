package com.toolbox.toolbox.service.user;

import com.toolbox.toolbox.model.dto.paramDto.UserParamDto;
import com.toolbox.toolbox.model.entity.User;
import com.toolbox.toolbox.repository.UserRepository;
import com.toolbox.toolbox.service.EntityFilterService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserFilterService implements EntityFilterService<User, UserParamDto> {
    private final UserRepository userRepository;

    @Override
    public Page<User> getFilteredItems(UserParamDto paramDto) {
        Specification<User> spec = build(paramDto);
        Pageable pageable = toPageable(paramDto);
        return userRepository.findAll(spec, pageable);
    }

    @Override
    public Specification<User> build(UserParamDto dto) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (dto.getUsername() != null && !dto.getUsername().trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("username")),
                        "%" + dto.getUsername().trim().toLowerCase() + "%"
                ));
            }

            if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("email")),
                        "%" + dto.getEmail().trim().toLowerCase() + "%"
                ));
            }

            if (dto.getRole() != null && !dto.getRole().trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("roles").get("name")),
                        "%" + dto.getRole().trim().toLowerCase() + "%"
                ));
            }

            if (Boolean.TRUE.equals(dto.getLocked())) predicates.add(criteriaBuilder.isTrue(root.get("locked")));
            else if (Boolean.FALSE.equals(dto.getLocked())) predicates.add(criteriaBuilder.isFalse(root.get("locked")));

            if (Boolean.TRUE.equals(dto.getEnabled())) predicates.add(criteriaBuilder.isTrue(root.get("enabled")));
            else if (Boolean.FALSE.equals(dto.getEnabled())) predicates.add(criteriaBuilder.isFalse(root.get("enabled")));

            query.where(predicates.toArray(new Predicate[0]));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Override
    public Pageable toPageable(UserParamDto dto) {
        int pageSize = (dto.getLimit() != null && dto.getLimit() > 0)
                ? Math.toIntExact(Math.min(dto.getLimit(), 100)) : 100;

        int pageIndex = (dto.getPage() != null && dto.getPage() >= 0)
                ? dto.getPage() : 0;

        Sort sort = Sort.by("id").descending(); // tri par défaut
        if (dto.getSort() != null && !dto.getSort().isEmpty()) {
            String[] orders = dto.getSort().split(",");

            if (orders.length == 2 && orders[0].matches("^[a-zA-Z0-9_.]+$") && orders[1].matches("^(ASC|DESC)$")) {
                String property = orders[0];
                String direction = orders[1].toUpperCase();

                sort = direction.equals("DESC") ? Sort.by(property).descending() : Sort.by(property).ascending();
            } else {
                throw new IllegalArgumentException("Invalid sort format. Expected 'property,ASC|DESC'.");
            }
        }

        return PageRequest.of(pageIndex, pageSize, sort);
    }
}
