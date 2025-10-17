package com.toolbox.toolbox.service.user;

import com.toolbox.toolbox.model.dto.inputDto.UserInputDto;
import com.toolbox.toolbox.model.dto.inputDto.UserPatchDto;
import com.toolbox.toolbox.model.dto.inputDto.UserResetDto;
import com.toolbox.toolbox.model.dto.inputDto.UserRoleDto;
import com.toolbox.toolbox.model.dto.paramDto.UserParamDto;
import com.toolbox.toolbox.model.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserFilterService filterService;
    private final UserValidationService validationService;
    private final UserCreateService createService;
    private final UserUpdateService updateService;
    private final UserDeleteService deleteService;
    private final UserRoleService roleService;

    public Page<User> getFilteredItems(UserParamDto paramDto) {
        return filterService.getFilteredItems(paramDto);
    }

    public User getOneItemById(Long id) {
        return validationService.getOneItemById(id);
    }

    public User getOneItemByEmail(String email) {
        return validationService.getOneItemByEmail(email);
    }

    public User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return getOneItemByEmail(authentication.getName());
    }

    @Transactional
    public User create(UserInputDto dto) {
        return createService.create(dto);
    }

    public User update(Long id, UserPatchDto dto) {
        User auth = getAuthenticatedUser();
        User user = getOneItemById(id);
        validationService.ensureUserCanUpdate(auth, user);
        return updateService.updateUser(user, dto);
    }

    public User updatePassword(Long id, UserResetDto dto) {
        User user = getOneItemById(id);
        return updateService.updatePassword(user, dto);
    }

    public void enable(User user) {
        updateService.enable(user);
    }

    public void delete(Long id) {
        User user = getOneItemById(id);
        User auth = getAuthenticatedUser();
        deleteService.delete(user, auth);
    }

    public void assignRole(UserRoleDto dto) {
        User user = getOneItemById(dto.getUserId());
        roleService.assign(user, dto.getName());
    }

    public void removeRole(UserRoleDto dto) {
        User user = getOneItemById(dto.getUserId());
        roleService.remove(user, dto.getName());
    }
}