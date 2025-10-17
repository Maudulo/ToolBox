package com.toolbox.toolbox.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.toolbox.toolbox.model.dto.ErrorResponseDoc;
import com.toolbox.toolbox.service.user.UserDetailsServiceImpl;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class JwtRequestFilter extends OncePerRequestFilter {
    private final RsaKeyProperties rsaKeys;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        final String requestTokenHeader = request.getHeader("Authorization");

        String username = null;
        String jwtToken = null;

        // JWT Token est dans la forme "Bearer token". Supprimer le mot Bearer et obtenir uniquement le Token
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);

            try {
                Claims claims = Jwts.parser()
                        .setSigningKey(rsaKeys.publicKey())
                        .parseClaimsJws(jwtToken)
                        .getBody();
                username = claims.getSubject();
            } catch (ExpiredJwtException e) {
                sendErrorResponse(response, "JWT Token has expired", HttpStatus.UNAUTHORIZED);
                return;
            } catch (MalformedJwtException e) {
                sendErrorResponse(response, "Invalid JWT Token", HttpStatus.UNAUTHORIZED);
                return;
            } catch (IllegalArgumentException e) {
                sendErrorResponse(response, "Unable to get JWT Token", HttpStatus.UNAUTHORIZED);
                return;
            }
        } else {
            //logger.warn("JWT Token does not begin with Bearer String");
        }

        // Une fois que nous avons le token, valider le token
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // Si le token est valide, configurer l'authentification Spring Security manuellement
            if (Boolean.TRUE.equals(validateToken(jwtToken, userDetails))) {
                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                );
                usernamePasswordAuthenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
            }
        }
        filterChain.doFilter(request, response);
    }

    private Boolean validateToken(String token, UserDetails userDetails) {
        final String username = Jwts.parser().setSigningKey(rsaKeys.publicKey()).parseClaimsJws(token).getBody().getSubject();
        return (username.equals(userDetails.getUsername()));
    }

    void sendErrorResponse(HttpServletResponse response, String message, HttpStatus httpStatus) throws IOException {
        ErrorResponseDoc errorResponse = new ErrorResponseDoc();
        errorResponse.setMessage(message);
        errorResponse.setStatus(httpStatus.value());
        errorResponse.setError(httpStatus.getReasonPhrase());
        errorResponse.setTimestamp(Instant.now().toString());

        response.setStatus(httpStatus.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = new ObjectMapper();
        response.getWriter().write(mapper.writeValueAsString(errorResponse));
    }
}
