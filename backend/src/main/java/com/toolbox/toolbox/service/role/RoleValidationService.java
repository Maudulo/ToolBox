package com.toolbox.toolbox.service.role;

import com.toolbox.toolbox.model.entity.Role;
import com.toolbox.toolbox.repository.RoleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoleValidationService {
    private final RoleRepository roleRepository;

    public Role getOneItemByName(String name) {
        return roleRepository.findOneByName(name)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("Impossible de trouver l'entité %s avec la propiété %s = %s",
                                Role.class.getSimpleName(), "NAME", name)
                ));
    }
}
