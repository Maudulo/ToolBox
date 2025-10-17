package com.toolbox.toolbox.service.user;

import com.toolbox.toolbox.model.dto.inputDto.UserInputDto;
import com.toolbox.toolbox.model.entity.User;
import com.toolbox.toolbox.model.mapper.UserMapper;
import com.toolbox.toolbox.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserCreateService {
    private final UserMapper userMapper;
    private final UserRepository userRepository;

    @Transactional
    public User create(UserInputDto dto) {
        userRepository.findOneByEmail(dto.getEmail()).ifPresent(user -> {
            throw new IllegalArgumentException("Un utilisateur avec cet e-mail existe déjà");
        });

        User user = userMapper.postToEntity(dto);
        user = userRepository.saveAndFlush(user);

        return user;
    }
}