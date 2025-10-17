package com.toolbox.toolbox.service.role;

import com.toolbox.toolbox.model.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleReadService readService;
    private final RoleValidationService validationService;

    public List<Role> getAllItems() {
        return readService.getAll();
    }

    public Role getOneItemByName(String name) {
        return validationService.getOneItemByName(name);
    }
}
