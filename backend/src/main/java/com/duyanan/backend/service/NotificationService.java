package com.duyanan.backend.service;

import com.duyanan.backend.model.Notification;
import com.duyanan.backend.model.Order;
import com.duyanan.backend.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public NotificationService(NotificationRepository notificationRepository, EmailService emailService) {
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
    }

    /**
     * Creates an in-app notification for the order's owner and dispatches
     * an email notification asynchronously. Failures never interrupt order flow.
     */
    public void notifyOrderStatus(Order order) {
        if (order == null || order.getUser() == null) {
            return;
        }

        String status = order.getStatus() != null ? order.getStatus().trim().toUpperCase() : "PENDING";
        Long orderId = order.getId();
        double total = order.getTotalAmount() != null ? order.getTotalAmount() : 0.0;

        String title;
        String message;

        switch (status) {
            case "PREPARING" -> {
                title = "Order #" + orderId + " is Being Prepared 🔥";
                message = "Great news! Our kitchen is now preparing your order (#" + orderId + ").";
            }
            case "COMPLETED" -> {
                title = "Order #" + orderId + " Completed ✅";
                message = "Your order (#" + orderId + ") has been completed. Thank you for dining with Duyanan Restaurant!";
            }
            case "CANCELLED" -> {
                title = "Order #" + orderId + " Cancelled ❌";
                String reasonSuffix = (order.getCancellationReason() != null && !order.getCancellationReason().isBlank())
                        ? " Reason: " + order.getCancellationReason().trim()
                        : "";
                message = "Your order (#" + orderId + ") has been cancelled." + reasonSuffix;
            }
            default -> {
                title = "Order #" + orderId + " Placed";
                message = String.format("We have received your order of ₱%.2f and it is awaiting confirmation.", total);
            }
        }

        try {
            Notification notification = new Notification();
            notification.setUser(order.getUser());
            notification.setOrderId(orderId);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setOrderStatus(status);
            notification.setRead(false);
            notification.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Failed to save in-app notification for order #{}: {}", orderId, e.getMessage());
        }

        emailService.sendOrderStatusEmailAsync(order);
    }
}
