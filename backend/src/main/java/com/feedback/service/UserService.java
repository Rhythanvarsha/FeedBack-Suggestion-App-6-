package com.feedback.service;

import com.feedback.dto.UserDTO;
import com.feedback.entity.User;
import com.feedback.exception.BadRequestException;
import com.feedback.exception.UserAlreadyExistsException;
import com.feedback.exception.UserNotFoundException;
import com.feedback.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(String name, String email, String password, String role, String category) {
        if (userRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("Email already registered");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role != null ? role : "USER");

        // Category is meaningful only for admins.
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            if (category == null || category.trim().isEmpty()) {
                throw new BadRequestException("Admin category is required");
            }
            user.setCategory(category.trim());
        } else {
            user.setCategory(null);
        }

        return userRepository.save(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
    }

    public User getUserById(Long id) {
        if (id == null) {
            throw new UserNotFoundException("User id cannot be null");
        }
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
    }

    public boolean existsById(Long id) {
        if (id == null) {
            return false;
        }
        return userRepository.existsById(id);
    }

    public UserDTO getUserDTOByEmail(String email) {
        User user = getUserByEmail(email);
        return new UserDTO(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCategory());
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserDTO(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCategory()))
                .collect(Collectors.toList());
    }

    public User updateUser(Long id, String name, String email) {
        User user = getUserById(id);
        if (name != null) {
            user.setName(name);
        }
        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new UserAlreadyExistsException("Email already in use");
            }
            user.setEmail(email);
        }
        if (user != null) {
            return userRepository.save(user);
        }
        return user;
    }

    public void deleteUser(Long id) {
        User user = getUserById(id);
        if (user != null) {
            userRepository.delete(user);
        }
    }

    public long getTotalUsers() {
        return userRepository.count();
    }
}
