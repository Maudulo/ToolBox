package com.toolbox.toolbox.model.mapper;

import com.toolbox.toolbox.model.dto.inputDto.UserInputDto;
import com.toolbox.toolbox.model.dto.inputDto.UserPatchDto;
import com.toolbox.toolbox.model.dto.inputDto.UserResetDto;
import com.toolbox.toolbox.model.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class UserMapper {
    private final PasswordEncoder passwordEncoder;

    public User postToEntity(UserInputDto dto) {
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRoles(new ArrayList<>());
        user.setEnabled(false);
        user.setRegisterAt(LocalDateTime.now());

        return user;
    }

    public void patchToEntity(UserPatchDto dto, User user) {
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Le mot de passe actuel renseigné ne correspond pas avec le mot de passe actuel");
        }

        user.setEmail(dto.getEmail());
        user.setUsername(dto.getUsername());

        if (dto.getNewPassword() != null && !dto.getNewPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        }
    }

    public void resetPassToEntity(UserResetDto dto, User user) {
        user.setPassword(passwordEncoder.encode(dto.getPass()));
        user.setLocked(false);
    }
}
