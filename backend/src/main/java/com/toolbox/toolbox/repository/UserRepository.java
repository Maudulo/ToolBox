package com.toolbox.toolbox.repository;

import com.toolbox.toolbox.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findOneByEmail(@NonNull String email);

    Optional<User> findOneById(Long id);

    List<User> findByRoles_Name(String role);
}
