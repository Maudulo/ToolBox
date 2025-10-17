package com.toolbox.toolbox.service.auth;

import com.toolbox.toolbox.model.entity.Role;
import com.toolbox.toolbox.model.entity.User;
import com.toolbox.toolbox.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TokenClaimsService {
    private final UserRepository userRepository;

    public JwtClaimsSet buildClaimsFromAuthentication(Authentication authentication) {
        User user = userRepository.findOneByEmail(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        user.setLastConnectionAt(LocalDateTime.now());
        userRepository.saveAndFlush(user);

        return buildClaimsFromUser(user);
    }

    public JwtClaimsSet buildClaimsFromUser(User user) {
        Instant now = Instant.now();
        List<String> authorities = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        //String gameSession = getGameSession(user);

        return JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(now.plus(8, ChronoUnit.HOURS))
                .subject(user.getEmail())
                .claim("authorities", authorities)
                .claim("user", user.getId())
                .claim("username", user.getUsername())
                //.claim("game_session", gameSession)
                .build();
    }

    /*private String getGameSession(User user) {
        List<GameStatus> status = List.of(GameStatus.CREATED, GameStatus.CLOSED, GameStatus.STARTED);
        return partyRepository.findByUserAndGameStatusIn(user, status).stream()
                .filter(party -> party.getGame() != null && (party.getEnded() == null || !party.getEnded()))
                .map(party -> party.getGame().getAccessCode())
                .findFirst()
                .orElse("");
    }*/
}
