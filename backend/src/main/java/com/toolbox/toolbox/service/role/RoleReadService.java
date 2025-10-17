package com.toolbox.toolbox.service.role;

import com.toolbox.toolbox.model.entity.Role;
import com.toolbox.toolbox.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleReadService {
    private final RoleRepository roleRepository;

    public List<Role> getAll() {
        return roleRepository.findAll();
    }
}
