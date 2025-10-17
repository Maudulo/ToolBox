package com.toolbox.toolbox.service.auth;

import com.toolbox.toolbox.model.entity.User;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final JwtTokenService jwtTokenService;
    private final TokenClaimsService claimsService;
    private final SecurityContextTokenService securityContextTokenService;

    public String generateToken(Authentication authentication) {
        JwtClaimsSet claims = claimsService.buildClaimsFromAuthentication(authentication);
        return jwtTokenService.encode(claims);
    }

    public String refreshToken(User user) {
        JwtClaimsSet claims = claimsService.buildClaimsFromUser(user);
        return jwtTokenService.encode(claims);
    }

    public Claims getClaimsFromToken(String token) {
        return jwtTokenService.decode(token);
    }

    public String getCurrentJtwToken() {
        return securityContextTokenService.getCurrentJwtToken();
    }
}
