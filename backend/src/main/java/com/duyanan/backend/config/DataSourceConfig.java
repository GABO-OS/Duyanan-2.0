package com.duyanan.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:}")
    private String url;

    @Value("${spring.datasource.username:}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Value("${spring.datasource.driverClassName:com.mysql.cj.jdbc.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String finalUrl = url;
        String finalUsername = username;
        String finalPassword = password;

        // If the URL is provided in standard cloud URI format (e.g. mysql://user:pass@host:port/db?ssl-mode=REQUIRED)
        if (StringUtils.hasText(finalUrl) && finalUrl.startsWith("mysql://")) {
            try {
                URI uri = new URI(finalUrl);
                String userInfo = uri.getUserInfo();
                if (StringUtils.hasText(userInfo) && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    if (!StringUtils.hasText(finalUsername) || "root".equals(finalUsername)) {
                        finalUsername = parts[0];
                    }
                    if (!StringUtils.hasText(finalPassword)) {
                        finalPassword = parts[1];
                    }
                }

                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 3306;
                String path = uri.getPath();
                String query = uri.getQuery();

                StringBuilder jdbcBuilder = new StringBuilder("jdbc:mysql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append(StringUtils.hasText(path) ? path : "/duyanan_db");

                if (StringUtils.hasText(query)) {
                    // Standardize ssl-mode=REQUIRED to sslMode=REQUIRED for MySQL Connector/J
                    String sanitizedQuery = query.replace("ssl-mode=", "sslMode=");
                    jdbcBuilder.append("?").append(sanitizedQuery);
                }

                finalUrl = jdbcBuilder.toString();
                log.info("Auto-converted cloud database URI to JDBC URL: {}", finalUrl);
            } catch (Exception e) {
                log.warn("Failed to parse raw mysql:// URI, falling back to: {}", e.getMessage());
            }
        } else if (StringUtils.hasText(finalUrl)) {
            // Also sanitize ssl-mode in case it was passed directly into a jdbc: URL
            finalUrl = finalUrl.replace("ssl-mode=", "sslMode=");
        }

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(finalUrl);
        if (StringUtils.hasText(driverClassName)) {
            config.setDriverClassName(driverClassName);
        }
        if (StringUtils.hasText(finalUsername)) {
            config.setUsername(finalUsername);
        }
        if (StringUtils.hasText(finalPassword)) {
            config.setPassword(finalPassword);
        }

        return new HikariDataSource(config);
    }
}
