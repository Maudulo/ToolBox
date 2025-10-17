package com.toolbox.toolbox.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@ToString
@Table(name = "users")
public class User {
    @Id
    @ToString.Exclude
    @Getter
    @Setter
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter @Setter
    @Column(name= "email", nullable = false, unique = true, length = 180)
    private String email;

    @Getter @Setter
    @Column(name="username", nullable = false, length = 100)
    private String username;

    @Getter @Setter
    @JsonIgnore
    @Column(name = "password", nullable = false)
    private String password;

    @Getter @Setter
    @Column(name = "register_at", nullable = false)
    private LocalDateTime registerAt;

    @Getter @Setter
    @Column(name = "last_connection_at")
    private LocalDateTime lastConnectionAt;

    @Getter @Setter
    @Column(name="is_enabled", nullable = false)
    private boolean enabled;

    @Getter @Setter
    @Column(name="is_locked", nullable = false)
    private boolean locked;

    @ToString.Exclude
    @Getter @Setter
    @ManyToMany(
            fetch = FetchType.EAGER,
            cascade = {CascadeType.PERSIST, CascadeType.REMOVE}
    ) @JoinTable(
            name = "user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "role_id"})
    )
    private List<Role> roles;

    public User(){
        this.roles = new ArrayList<>();
    }

    public User(String email, String username, String password) {
        this.email = email;
        this.username = username;
        this.password = password;
        this.roles = new ArrayList<>();
    }

    @JsonIgnore
    public String getUserIdentifier() {
        return email;
    }

    public void addRole(Role role) {
        roles.add(role);
    }

    public void addRoleToUser(Role role) {
        if (!this.getRoles().contains(role)) {
            this.addRole(role);
        }
    }

    public void deleteRole(Role role) {
        if (this.getRoles().contains(role) && !Objects.equals(role.getName(), "ROLE_USER")) {
            roles.remove(role);
        }
    }
}