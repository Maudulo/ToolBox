package com.toolbox.toolbox.service.user;

import com.toolbox.toolbox.model.entity.Role;
import com.toolbox.toolbox.model.entity.User;
import com.toolbox.toolbox.repository.UserRepository;
import com.toolbox.toolbox.service.role.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserRoleService {
    private final UserRepository userRepository;
    private final RoleService roleService;

    public void assign(User user, String name) {
        Role role = roleService.getOneItemByName(name);

        if (user.getRoles().contains(role)) {
            throw new IllegalArgumentException("L'utilisateur possède déjà ce rôle");
        }

        user.addRoleToUser(role);
        userRepository.saveAndFlush(user);
    }


    public void remove(User user, String name) {
        Role role = roleService.getOneItemByName(name);

        if (!user.getRoles().contains(role)) {
            return;
        }

        if (role.getName().equals("ROLE_ADMIN")) {
            List<User> userList = userRepository.findByRoles_Name("ROLE_ADMIN");
            if (userList.size() <= 1) {
                throw new IllegalArgumentException("Un administrateur minimum est requis");
            }
        }

        user.deleteRole(role);
        userRepository.saveAndFlush(user);
    }
}
