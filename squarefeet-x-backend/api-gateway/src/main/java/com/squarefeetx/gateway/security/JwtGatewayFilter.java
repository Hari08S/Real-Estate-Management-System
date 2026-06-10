package com.squarefeetx.gateway.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtGatewayFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    // Public paths that don't require authentication
    private static final List<String> PUBLIC_PATHS = List.of(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/google",
        "/api/auth/refresh-token",
        "/api/auth/forgot-password",
        "/api/auth/reset-password/**",
        "/api/auth/verify-email",
        "/api/auth/resend-verification-otp",
        "/api/properties",
        "/api/properties/**",
        "/api/manager/by-city",
        "/api/chat/public/contact"
    );

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Allow CORS preflight requests through without a token
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Allow public paths through without a token
        boolean isPublic = PUBLIC_PATHS.stream().anyMatch(p -> pathMatcher.match(p, path));
        if (isPublic) {
            filterChain.doFilter(request, response);
            return;
        }

        // Require valid JWT for all other paths
        String token = extractToken(request);
        if (token != null && jwtUtil.isTokenValid(token)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized: valid token required\"}");
        }
    }

    private String extractToken(HttpServletRequest request) {
        // 1. Authorization: Bearer header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        // 2. accessToken cookie
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
