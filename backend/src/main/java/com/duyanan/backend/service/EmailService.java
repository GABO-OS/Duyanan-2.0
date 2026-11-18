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

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

    private final JavaMailSender mailSender;
    private final HttpClient httpClient;

    @Value("${spring.mail.username:duyananpb.ph@gmail.com}")
    private String fromEmail;

    @Value("${app.frontend-url:https://duyanan-frontend.onrender.com}")
    private String frontendUrl;

    @Value("${app.mail.google-script-url:}")
    private String googleScriptUrl;

    @Value("${app.mail.brevo-api-key:}")
    private String brevoApiKey;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        this.httpClient = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(15))
                .build();
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
        String subject = "Duyanan Restaurant — Reset Your Password";

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
                            <a href="{{RESET_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #c2703a, #a0522d); color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 15px rgba(194,112,58,0.4);">
                                Reset My Password
                            </a>
                        </div>
                        <p style="color: #999; font-size: 13px; line-height: 1.6;">
                            This link will expire in <strong>30 minutes</strong>. If you did not request a password reset, please ignore this email — your password will remain unchanged.
                        </p>
                        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;">
                        <p style="color: #666; font-size: 12px; text-align: center;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="{{RESET_LINK}}" style="color: #c2703a; word-break: break-all;">{{RESET_LINK}}</a>
                        </p>
                    </div>
                </div>
                """.replace("{{RESET_LINK}}", resetLink);

        dispatchHtmlEmail(toEmail, subject, htmlContent);
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

        OrderEmailPayload payload = buildOrderPayload(order, toEmail, user.getFirstName());

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
        OrderEmailPayload payload = buildOrderPayload(
                order,
                order.getUser().getEmail(),
                order.getUser().getFirstName()
        );
        sendOrderStatusEmail(payload);
    }

    private OrderEmailPayload buildOrderPayload(Order order, String toEmail, String firstName) {
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

        return new OrderEmailPayload(
                toEmail,
                firstName != null ? firstName : "Valued Customer",
                order.getId(),
                order.getStatus() != null ? order.getStatus().toUpperCase() : "PENDING",
                order.getTotalAmount() != null ? order.getTotalAmount() : 0.0,
                order.getOrderType() != null ? order.getOrderType() : "DELIVERY",
                order.getCancellationReason(),
                itemSummaries
        );
    }

    private void sendOrderStatusEmail(OrderEmailPayload payload) throws MessagingException {
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
                : "<table style=\"width:100%;border-collapse:collapse;margin:16px 0;\">"
                  + itemsHtml
                  + "</table>";

        String cancellationHtml = ("CANCELLED".equals(payload.status())
                && payload.cancellationReason() != null
                && !payload.cancellationReason().isBlank())
                ? "<div style=\"background:#fdf0f0;border-left:4px solid #e74c3c;padding:12px 16px;border-radius:8px;margin:16px 0;color:#a93226;font-size:14px;\">"
                  + "<strong>Cancellation Reason:</strong> "
                  + escapeHtml(payload.cancellationReason())
                  + "</div>"
                : "";

        String orderTypeLabel = switch (payload.orderType().toUpperCase()) {
            case "DINE_IN" -> "Dine-In (Pre-Order)";
            case "PICKUP" -> "Pick-Up at Restaurant";
            default -> "Delivery";
        };

        String profileLink = frontendUrl + "/profile";
        String subject = String.format("Duyanan Restaurant — Order #%d Update: %s", payload.orderId(), statusLabel);
        String totalFormatted = String.format("₱%.2f", payload.totalAmount());

        String htmlContent = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fdfbf7; border-radius: 16px; overflow: hidden; border: 1px solid #ede5dc;">
                    <div style="background: linear-gradient(135deg, #6e2c00 0%, #28140a 100%); padding: 32px 24px; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px;">🍽️ Duyanan Restaurant</h1>
                        <p style="color: rgba(255,200,120,0.9); margin: 8px 0 0; font-size: 14px;">Order #{{ORDER_ID}} Status Update</p>
                    </div>
                    <div style="padding: 28px 24px; background: #ffffff;">
                        <p style="color: #333; font-size: 15px; margin-top: 0;">Hello <strong>{{FIRST_NAME}}</strong>,</p>
                        <div style="margin: 16px 0;">
                            <span style="display: inline-block; background: {{BADGE_COLOR}}; color: #fff; padding: 6px 16px; border-radius: 50px; font-size: 13px; font-weight: bold;">
                                {{STATUS_LABEL}}
                            </span>
                        </div>
                        <p style="color: #555; font-size: 15px; line-height: 1.6;">{{STATUS_HEADLINE}}</p>
                        {{CANCELLATION_HTML}}
                        <div style="background: #faf6f1; border-radius: 12px; padding: 16px 20px; margin: 20px 0; border: 1px solid #f0e6db;">
                            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #8b624b; font-weight: bold; margin-bottom: 8px;">
                                Order Summary • {{ORDER_TYPE}}
                            </div>
                            {{ITEMS_SECTION}}
                            <div style="display: flex; justify-content: space-between; padding-top: 10px; font-size: 16px; font-weight: bold; color: #6e2c00;">
                                <span>Total Amount:&nbsp;</span>
                                <span>{{TOTAL_AMOUNT}}</span>
                            </div>
                        </div>
                        <div style="text-align: center; margin: 28px 0 12px;">
                            <a href="{{PROFILE_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #d35400, #a04000); color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-weight: bold; font-size: 14px;">
                                View My Order
                            </a>
                        </div>
                    </div>
                    <div style="padding: 16px 24px; text-align: center; color: #999; font-size: 12px; background: #faf6f1;">
                        Duyanan Restaurant • Padre Burgos, Quezon
                    </div>
                </div>
                """
                .replace("{{ORDER_ID}}", String.valueOf(payload.orderId()))
                .replace("{{FIRST_NAME}}", escapeHtml(payload.firstName()))
                .replace("{{BADGE_COLOR}}", statusBadgeColor)
                .replace("{{STATUS_LABEL}}", escapeHtml(statusLabel))
                .replace("{{STATUS_HEADLINE}}", escapeHtml(statusHeadline))
                .replace("{{CANCELLATION_HTML}}", cancellationHtml)
                .replace("{{ORDER_TYPE}}", escapeHtml(orderTypeLabel))
                .replace("{{ITEMS_SECTION}}", itemsSection)
                .replace("{{TOTAL_AMOUNT}}", totalFormatted)
                .replace("{{PROFILE_LINK}}", profileLink);

        dispatchHtmlEmail(payload.toEmail(), subject, htmlContent);
        log.info("Order status email ({}) dispatched for order #{} to {}", payload.status(), payload.orderId(), payload.toEmail());
    }

    /**
     * Dispatches an HTML email using HTTPS relays first (which bypass Render Free Tier
     * outbound SMTP port blocks), falling back to standard SMTP via JavaMailSender.
     */
    private void dispatchHtmlEmail(String toEmail, String subject, String htmlContent) throws MessagingException {
        String safeTo = Objects.requireNonNull(toEmail);
        String safeSubject = Objects.requireNonNullElse(subject, "Duyanan Restaurant Notification");
        String safeHtml = Objects.requireNonNullElse(htmlContent, "");

        // Priority 1: Google Apps Script HTTPS Relay
        if (googleScriptUrl != null && !googleScriptUrl.isBlank()) {
            if (sendViaGoogleAppsScript(safeTo, safeSubject, safeHtml)) {
                return;
            }
        }

        // Priority 2: Brevo HTTPS Transactional Email API
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            if (sendViaBrevo(safeTo, safeSubject, safeHtml)) {
                return;
            }
            throw new MessagingException("Brevo HTTPS API delivery failed. Check Render logs for Brevo HTTP status response.");
        }

        // Priority 3: Standard SMTP (JavaMailSender)
        sendViaSmtp(safeTo, safeSubject, safeHtml);
    }

    private boolean sendViaGoogleAppsScript(String toEmail, String subject, String htmlContent) {
        try {
            String jsonBody = String.format(
                    "{\"to\":\"%s\",\"subject\":\"%s\",\"html\":\"%s\",\"senderName\":\"Duyanan Restaurant\"}",
                    escapeJson(toEmail),
                    escapeJson(subject),
                    escapeJson(htmlContent)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(googleScriptUrl.trim()))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(Objects.requireNonNull(jsonBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            String finalHost = response.uri() != null && response.uri().getHost() != null
                    ? response.uri().getHost()
                    : "";

            if (finalHost.contains("accounts.google.com")) {
                log.warn("Google Apps Script relay redirected to Google Sign-In; verify deployment access is set to 'Anyone'. Falling back.");
                return false;
            }

            if (status >= 200 && status < 400) {
                log.info("Email sent via Google Apps Script HTTPS relay to {} (HTTP {})", toEmail, status);
                return true;
            }
            log.warn("Google Apps Script relay returned HTTP {}: {}", status, response.body());
        } catch (Exception e) {
            log.warn("Google Apps Script relay failed for {}: {}", toEmail, e.getMessage());
        }
        return false;
    }

    private boolean sendViaBrevo(String toEmail, String subject, String htmlContent) {
        try {
            String senderEmail = (fromEmail != null && !fromEmail.isBlank())
                    ? fromEmail.trim()
                    : "duyananpb.ph@gmail.com";

            String jsonBody = String.format(
                    "{\"sender\":{\"name\":\"Duyanan Restaurant\",\"email\":\"%s\"}," +
                    "\"to\":[{\"email\":\"%s\"}]," +
                    "\"subject\":\"%s\"," +
                    "\"htmlContent\":\"%s\"}",
                    escapeJson(senderEmail),
                    escapeJson(toEmail),
                    escapeJson(subject),
                    escapeJson(htmlContent)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_ENDPOINT))
                    .timeout(Duration.ofSeconds(20))
                    .header("accept", "application/json")
                    .header("api-key", brevoApiKey.trim())
                    .header("content-type", "application/json; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(Objects.requireNonNull(jsonBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status >= 200 && status < 300) {
                log.info("Email sent via Brevo HTTPS API to {} (HTTP {})", toEmail, status);
                return true;
            }
            log.warn("Brevo API returned HTTP {}: {}", status, response.body());
        } catch (Exception e) {
            log.warn("Brevo HTTPS API failed for {}: {}", toEmail, e.getMessage());
        }
        return false;
    }

    private void sendViaSmtp(String toEmail, String subject, String htmlContent) throws MessagingException {
        if (fromEmail == null || fromEmail.isBlank()) {
            log.info("Skipping SMTP email to {}: spring.mail.username is not configured.", toEmail);
            return;
        }
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(Objects.requireNonNull(fromEmail));
        helper.setTo(Objects.requireNonNull(toEmail));
        helper.setSubject(Objects.requireNonNull(subject));
        helper.setText(Objects.requireNonNull(htmlContent), true);
        mailSender.send(message);
        log.info("Email sent via SMTP to {}", toEmail);
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

    private static String escapeJson(String input) {
        if (input == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(input.length() + 16);
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            switch (c) {
                case '\\' -> sb.append("\\\\");
                case '"' -> sb.append("\\\"");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }
}
