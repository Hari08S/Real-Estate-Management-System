package com.squarefeetx.auth.repository;

import com.squarefeetx.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.email = :email")
    boolean existsByEmail(@Param("email") String email);

    List<User> findByRolesContaining(String role);
    Optional<User> findByResetToken(String resetToken);

    @Query("SELECT u FROM User u JOIN u.cities c WHERE LOWER(c) = LOWER(:city) AND 'MANAGER' MEMBER OF u.roles")
    List<User> findManagersByCity(@Param("city") String city);
}
