package com.toolbox.toolbox.service.user;

import com.toolbox.toolbox.model.entity.User;
import com.toolbox.toolbox.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDeleteService {
    private final UserRepository userRepository;

    public void delete(User user, User auth) {
        boolean userAuth = user.equals(auth);
        boolean authAdmin = hasRole(auth, "ROLE_ADMIN");
        boolean userAdmin = hasRole(user, "ROLE_ADMIN");

        if (userAuth && authAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Impossible de supprimer ce compte : la suppression de son propre compte admin est bloquée");
        }

        if (!userAuth) {
            if (!authAdmin) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Vous n'êtes pas autorisé à faire cette action");
            }

            if (userAdmin && isLastAdmin()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Impossible de supprimer ce compte : il reste le seul administrateur");
            }
        }

        userRepository.delete(user);
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles().stream()
                .anyMatch(role -> role.getName().equals(roleName));
    }

    private boolean isLastAdmin() {
        List<User> admList = userRepository.findByRoles_Name("ROLE_ADMIN");
        return admList.size() <= 1;
    }
}
