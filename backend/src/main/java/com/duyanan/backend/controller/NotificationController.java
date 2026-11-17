package com.duyanan.backend.controller;

import com.duyanan.backend.model.Notification;
import com.duyanan.backend.model.User;
import com.duyanan.backend.repository.NotificationRepository;
import com.duyanan.backend.repository.UserRepository;
import com.duyanan.backend.util.JwtUtil;
import org.jspecify.annotations.NonNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public NotificationController(NotificationRepository notificationRepository,
                                  UserRepository userRepository,
                                  JwtUtil jwtUtil) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    private User resolveCurrentUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid authorization header");
        }
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.validateToken(token).getSubject();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<?> getMyNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            User user = resolveCurrentUser(authHeader);
            List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired session"));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@RequestHeader("Authorization") String authHeader) {
        try {
            User user = resolveCurrentUser(authHeader);
            long count = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
            return ResponseEntity.ok(Map.of("unreadCount", count));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired session"));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@RequestHeader("Authorization") String authHeader,
                                        @PathVariable @NonNull Long id) {
        try {
            User user = resolveCurrentUser(authHeader);
            var foundOpt = notificationRepository.findById(id);
            if (foundOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Notification notification = foundOpt.get();
            if (!notification.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized access."));
            }
            notification.setRead(true);
            notificationRepository.save(notification);
            return ResponseEntity.ok(Map.of("message", "Marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired session"));
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@RequestHeader("Authorization") String authHeader) {
        try {
            User user = resolveCurrentUser(authHeader);
            List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                    .stream()
                    .filter(n -> !n.isRead())
                    .peek(n -> n.setRead(true))
                    .toList();
            if (!unread.isEmpty()) {
                notificationRepository.saveAll(unread);
            }
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired session"));
        }
    }
}
