package com.toolbox.toolbox.service.user;

import com.toolbox.toolbox.model.dto.inputDto.UserPatchDto;
import com.toolbox.toolbox.model.dto.inputDto.UserResetDto;
import com.toolbox.toolbox.model.entity.Role;
import com.toolbox.toolbox.model.entity.User;
import com.toolbox.toolbox.model.mapper.UserMapper;
import com.toolbox.toolbox.repository.RoleRepository;
import com.toolbox.toolbox.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserUpdateService {
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public User updateUser(User user, UserPatchDto dto) {
        userMapper.patchToEntity(dto, user);
        return userRepository.saveAndFlush(user);
    }

    public User updatePassword(User user, UserResetDto dto) {
        userMapper.resetPassToEntity(dto, user);
        return userRepository.saveAndFlush(user);
    }

    public void enable(User user) {
        user.setEnabled(true);
        Role role = roleRepository.findOneByName("ROLE_USER")
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("Impossible de trouver l'entité %s avec la propriété %s = %s",
                                Role.class.getSimpleName(), "NAME", "ROLE_USER")
                ));
        user.addRole(role);
        userRepository.saveAndFlush(user);
    }
}
