package com.duyanan.backend;

import com.duyanan.backend.model.*;
import com.duyanan.backend.repository.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Read secure admin password from Render environment variable
        String envPassword = System.getenv("ADMIN_PASSWORD");

        Optional<User> adminOpt = userRepository.findByEmail("admin@duyanan.com");
        if (adminOpt.isPresent()) {
            if (envPassword != null && !envPassword.trim().isEmpty()) {
                User admin = adminOpt.get();
                admin.setPassword(passwordEncoder.encode(envPassword.trim()));
                admin.setRole("ADMIN");
                userRepository.save(admin);
                log.info("Admin password updated securely from ADMIN_PASSWORD environment variable.");
            }
        } else {
            User admin = new User();
            admin.setFirstName("Admin");
            admin.setLastName("Duyanan");
            admin.setEmail("admin@duyanan.com");
            String initialPassword = (envPassword != null && !envPassword.trim().isEmpty())
                    ? envPassword.trim()
                    : "admin123";
            admin.setPassword(passwordEncoder.encode(initialPassword));
            admin.setRole("ADMIN");
            userRepository.save(admin);
            log.info("Default admin account created.");
        }
    }
}
