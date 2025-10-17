package com.toolbox.toolbox.service.user;

import com.toolbox.toolbox.model.entity.User;
import com.toolbox.toolbox.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserValidationService {
    private final UserRepository userRepository;

    public void ensureUserCanUpdate(User auth, User target) {
        boolean userAuth = target.equals(auth);
        boolean authAdmin = auth.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ROLE_ADMIN"));

        if (!userAuth && !authAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'êtes pas autorisé à faire cette action");
        }
    }

    public User getOneItemById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("Impossible de trouver l'entité %s avec la propiété %s = %s",
                                User.class.getSimpleName(), "ID", id)
                ));
    }

    public User getOneItemByEmail(String email) {
        return userRepository.findOneByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("Impossible de trouver l'entité %s avec la propiété %s = %s",
                                User.class.getSimpleName(), "EMAIL", email)
                ));
    }
}
