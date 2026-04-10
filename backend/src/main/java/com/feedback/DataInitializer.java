package com.feedback;

import com.feedback.entity.User;
import com.feedback.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@feedback.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setCategory("Website");
            userRepository.save(admin);

            User user = new User();
            user.setName("John Doe");
            user.setEmail("john@feedback.com");
            user.setPassword(passwordEncoder.encode("admin123"));
            user.setRole("USER");
            userRepository.save(user);

            System.out.println("Sample users created!");
        }
    }
}
