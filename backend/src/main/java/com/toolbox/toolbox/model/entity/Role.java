package com.toolbox.toolbox.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Objects;

@NoArgsConstructor
@Entity
@ToString
@Table(name = "roles")
public class Role {
    @Id
    @ToString.Exclude
    @Getter
    @Setter
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore()
    private Long id;

    @Getter @Setter
    @Column(name="name", nullable = false, unique = true, length = 50)
    private String name;

    @Getter @Setter
    @Column(name="priority", unique = true)
    private Long priority;

    public Role(String name) {
        this.name = name;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Role role = (Role) o;
        return Objects.equals(name, role.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);
    }
}
