package com.feedback.service;

import com.feedback.dto.AuthRequest;
import com.feedback.dto.AuthResponse;
import com.feedback.dto.RegisterRequest;
import com.feedback.dto.UserDTO;
import com.feedback.entity.User;
import com.feedback.exception.BadRequestException;
import com.feedback.security.JwtTokenProvider;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserDetailsService userDetailsService;

    public AuthResponse register(@NonNull RegisterRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BadRequestException("Name is required");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new BadRequestException("Password is required");
        }

        User user = userService.registerUser(
                request.getName().trim(),
                request.getEmail().trim(),
                request.getPassword(),
                request.getRole(),
                request.getCategory()
        );

        UserDTO userDTO = new UserDTO(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCategory());
        return new AuthResponse(null, "User registered successfully", userDTO);
    }

    public AuthResponse login(AuthRequest request) {
        if (request == null) {
            throw new BadRequestException("Request body is required");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new BadRequestException("Password is required");
        }
        try {
            System.out.println("Attempting to authenticate user: " + request.getEmail());
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );
            System.out.println("Authentication successful for user: " + request.getEmail());
        } catch (AuthenticationException ex) {
            System.out.println("Authentication failed for user: " + request.getEmail() + " - " + ex.getMessage());
            throw new BadCredentialsException("Invalid email or password");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtTokenProvider.generateToken(userDetails);

        User user = userService.getUserByEmail(request.getEmail());
        UserDTO userDTO = new UserDTO(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCategory());

        return new AuthResponse(token, "Login successful", userDTO);
    }

    public AuthResponse logout() {
        return new AuthResponse(null, "Logout successful", null);
    }

    public UserDTO getUserProfile(String email) {
        return userService.getUserDTOByEmail(email);
    }
}
