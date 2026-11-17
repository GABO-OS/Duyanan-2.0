package com.duyanan.backend.service;

import com.duyanan.backend.model.Order;
import com.duyanan.backend.model.OrderItem;
import com.duyanan.backend.model.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private record ItemSummary(String name, String variant, int quantity, double subtotal) {}

    private record OrderEmailPayload(
            String toEmail,
            String firstName,
            Long orderId,
            String status,
            double totalAmount,
            String orderType,
            String cancellationReason,
            List<ItemSummary> items
    ) {}

    public void sendPasswordResetEmail(String toEmail, String token) throws MessagingException {
        if (toEmail == null || toEmail.isBlank()) {
            return;
        }
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        if (fromEmail != null && !fromEmail.isBlank()) {
            helper.setFrom(fromEmail);
        }
        helper.setTo(toEmail);
        helper.setSubject("Duyanan Restaurant — Reset Your Password");

        String htmlContent = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #6e2c00 0%, #28140a 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px;">🍽️ Duyanan Restaurant</h1>
                        <p style="color: rgba(255,200,120,0.85); margin-top: 8px; font-size: 14px;">Password Reset Request</p>
                    </div>
                    <div style="padding: 30px;">
                        <p style="color: #e0e0e0; font-size: 15px; line-height: 1.6;">
                            Hello,<br><br>
                            We received a request to reset the password for your Duyanan account. Click the button below to set a new password:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #c2703a, #a0522d); color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 15px rgba(194,112,58,0.4);">
                                Reset My Password
                            </a>
                        </div>
                        <p style="color: #999; font-size: 13px; line-height: 1.6;">
                            This link will expire in <strong>30 minutes</strong>. If you did not request a password reset, please ignore this email — your password will remain unchanged.
                        </p>
                        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;">
                        <p style="color: #666; font-size: 12px; text-align: center;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="%s" style="color: #c2703a; word-break: break-all;">%s</a>
                        </p>
                    </div>
                </div>
                """.formatted(resetLink, resetLink, resetLink);

        helper.setText(Objects.requireNonNullElse(htmlContent, ""), true);
        mailSender.send(message);
    }

    /**
     * Extracts order details synchronously on the caller thread to avoid lazy-loading issues,
     * then dispatches the order status HTML email asynchronously.
     */
    public void sendOrderStatusEmailAsync(Order order) {
        if (order == null || order.getUser() == null) {
            return;
        }
        User user = order.getUser();
        String toEmail = user.getEmail();
        if (toEmail == null || toEmail.isBlank()) {
            return;
        }

        List<ItemSummary> itemSummaries = new ArrayList<>();
        try {
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    String prodName = (item.getProduct() != null && item.getProduct().getName() != null)
                            ? item.getProduct().getName()
                            : "Menu Item";
                    String variant = item.getVariant() != null ? item.getVariant() : "";
                    int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                    double sub = item.getSubtotal() != null ? item.getSubtotal() : 0.0;
                    itemSummaries.add(new ItemSummary(prodName, variant, qty, sub));
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract order items for email on order {}: {}", order.getId(), e.getMessage());
        }

        OrderEmailPayload payload = new OrderEmailPayload(
                toEmail,
                user.getFirstName() != null ? user.getFirstName() : "Valued Customer",
                order.getId(),
                order.getStatus() != null ? order.getStatus().toUpperCase() : "PENDING",
                order.getTotalAmount() != null ? order.getTotalAmount() : 0.0,
                order.getOrderType() != null ? order.getOrderType() : "DELIVERY",
                order.getCancellationReason(),
                itemSummaries
        );

        CompletableFuture.runAsync(() -> {
            try {
                sendOrderStatusEmail(payload);
            } catch (Exception e) {
                log.error("Failed to send order status email for order #{} to {}: {}",
                        payload.orderId(), payload.toEmail(), e.getMessage());
            }
        });
    }

    public void sendOrderStatusEmail(Order order) throws MessagingException {
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
            return;
        }
        List<ItemSummary> itemSummaries = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                String prodName = (item.getProduct() != null && item.getProduct().getName() != null)
                        ? item.getProduct().getName()
                        : "Menu Item";
                String variant = item.getVariant() != null ? item.getVariant() : "";
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                double sub = item.getSubtotal() != null ? item.getSubtotal() : 0.0;
                itemSummaries.add(new ItemSummary(prodName, variant, qty, sub));
            }
        }
        OrderEmailPayload payload = new OrderEmailPayload(
                order.getUser().getEmail(),
                order.getUser().getFirstName() != null ? order.getUser().getFirstName() : "Valued Customer",
                order.getId(),
                order.getStatus() != null ? order.getStatus().toUpperCase() : "PENDING",
                order.getTotalAmount() != null ? order.getTotalAmount() : 0.0,
                order.getOrderType() != null ? order.getOrderType() : "DELIVERY",
                order.getCancellationReason(),
                itemSummaries
        );
        sendOrderStatusEmail(payload);
    }

    private void sendOrderStatusEmail(OrderEmailPayload payload) throws MessagingException {
        if (fromEmail == null || fromEmail.isBlank()) {
            log.info("Skipping order status email for order #{}: spring.mail.username is not configured.", payload.orderId());
            return;
        }

        String statusLabel;
        String statusBadgeColor;
        String statusHeadline;

        switch (payload.status()) {
            case "PREPARING" -> {
                statusLabel = "Preparing Your Food";
                statusBadgeColor = "#f39c12";
                statusHeadline = "Our kitchen is now preparing your order!";
            }
            case "COMPLETED" -> {
                statusLabel = "Completed";
                statusBadgeColor = "#2ecc71";
                statusHeadline = "Your order is complete! Thank you for dining with Duyanan.";
            }
            case "CANCELLED" -> {
                statusLabel = "Cancelled";
                statusBadgeColor = "#e74c3c";
                statusHeadline = "Your order has been cancelled.";
            }
            default -> {
                statusLabel = "Order Placed";
                statusBadgeColor = "#d35400";
                statusHeadline = "We've received your order and it is awaiting confirmation.";
            }
        }

        StringBuilder itemsHtml = new StringBuilder();
        for (ItemSummary item : payload.items()) {
            String variantHtml = (item.variant() != null && !item.variant().isBlank())
                    ? " <span style=\"color:#888;font-size:12px;\">(" + escapeHtml(item.variant()) + ")</span>"
                    : "";
            itemsHtml.append(String.format(
                    "<tr>" +
                    "<td style=\"padding:8px 0;border-bottom:1px solid #f0ece8;color:#333;font-size:14px;\"><strong>%dx</strong> %s%s</td>" +
                    "<td style=\"padding:8px 0;border-bottom:1px solid #f0ece8;color:#333;font-size:14px;text-align:right;font-weight:600;\">₱%.2f</td>" +
                    "</tr>",
                    item.quantity(), escapeHtml(item.name()), variantHtml, item.subtotal()
            ));
        }

        String itemsSection = itemsHtml.isEmpty()
                ? ""
                : """
                  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                      %s
                  </table>
                  """.formatted(itemsHtml.toString());

        String cancellationHtml = ("CANCELLED".equals(payload.status())
                && payload.cancellationReason() != null
                && !payload.cancellationReason().isBlank())
                ? """
                  <div style="background:#fdf0f0;border-left:4px solid #e74c3c;padding:12px 16px;border-radius:8px;margin:16px 0;color:#a93226;font-size:14px;">
                      <strong>Cancellation Reason:</strong> %s
                  </div>
                  """.formatted(escapeHtml(payload.cancellationReason()))
                : "";

        String orderTypeLabel = switch (payload.orderType().toUpperCase()) {
            case "DINE_IN" -> "Dine-In (Pre-Order)";
            case "PICKUP" -> "Pick-Up at Restaurant";
            default -> "Delivery";
        };

        String profileLink = frontendUrl + "/profile";
        String subject = String.format("Duyanan Restaurant — Order #%d Update: %s", payload.orderId(), statusLabel);

        String htmlContent = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fdfbf7; border-radius: 16px; overflow: hidden; border: 1px solid #ede5dc;">
                    <div style="background: linear-gradient(135deg, #6e2c00 0%, #28140a 100%); padding: 32px 24px; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px;">🍽️ Duyanan Restaurant</h1>
                        <p style="color: rgba(255,200,120,0.9); margin: 8px 0 0; font-size: 14px;">Order #%d Status Update</p>
                    </div>
                    <div style="padding: 28px 24px; background: #ffffff;">
                        <p style="color: #333; font-size: 15px; margin-top: 0;">Hello <strong>%s</strong>,</p>
                        <div style="margin: 16px 0;">
                            <span style="display: inline-block; background: %s; color: #fff; padding: 6px 16px; border-radius: 50px; font-size: 13px; font-weight: bold;">
                                %s
                            </span>
                        </div>
                        <p style="color: #555; font-size: 15px; line-height: 1.6;">%s</p>
                        %s
                        <div style="background: #faf6f1; border-radius: 12px; padding: 16px 20px; margin: 20px 0; border: 1px solid #f0e6db;">
                            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #8b624b; font-weight: bold; margin-bottom: 8px;">
                                Order Summary • %s
                            </div>
                            %s
                            <div style="display: flex; justify-content: space-between; padding-top: 10px; font-size: 16px; font-weight: bold; color: #6e2c00;">
                                <span>Total Amount:&nbsp;</span>
                                <span>₱%.2f</span>
                            </div>
                        </div>
                        <div style="text-align: center; margin: 28px 0 12px;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #d35400, #a04000); color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-weight: bold; font-size: 14px;">
                                View My Order
                            </a>
                        </div>
                    </div>
                    <div style="padding: 16px 24px; text-align: center; color: #999; font-size: 12px; background: #faf6f1;">
                        Duyanan Restaurant • Padre Burgos, Quezon
                    </div>
                </div>
                """.formatted(
                payload.orderId(),
                escapeHtml(payload.firstName()),
                statusBadgeColor,
                escapeHtml(statusLabel),
                escapeHtml(statusHeadline),
                cancellationHtml,
                escapeHtml(orderTypeLabel),
                itemsSection,
                payload.totalAmount(),
                profileLink
        );

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(Objects.requireNonNull(payload.toEmail()));
        helper.setSubject(Objects.requireNonNull(subject));
        helper.setText(Objects.requireNonNull(htmlContent), true);

        mailSender.send(message);
        log.info("Order status email ({}) sent for order #{} to {}", payload.status(), payload.orderId(), payload.toEmail());
    }

    private static String escapeHtml(String input) {
        if (input == null) {
            return "";
        }
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
