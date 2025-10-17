package com.toolbox.toolbox.repository;

import com.toolbox.toolbox.model.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long>, JpaSpecificationExecutor<Role> {
    Optional<Role> findOneById(Long id);

    Optional<Role> findOneByName(String name);
}
