package com.duyanan.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures critical database tables and columns exist in production cloud MySQL,
 * even when SPRING_JPA_HIBERNATE_DDL_AUTO=none is configured.
 */
@Component
public class DatabaseInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);
    private final JdbcTemplate jdbcTemplate;

    public DatabaseInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            log.info("Checking database schema consistency for product and product_combos...");

            // 1. Ensure table 'product' exists
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS product (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255),
                    price_solo DOUBLE,
                    price_ala_carte DOUBLE,
                    price_ala_carte2 DOUBLE,
                    price1_liter DOUBLE,
                    price1_point5_liter DOUBLE,
                    price2_liter DOUBLE,
                    description TEXT,
                    image_url VARCHAR(500),
                    category VARCHAR(100),
                    flavors VARCHAR(255),
                    out_of_stock BOOLEAN DEFAULT FALSE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """);

            // 2. Safe addition of columns in case the table existed from an older version
            safeAddColumn("product", "price_solo", "DOUBLE DEFAULT 0");
            safeAddColumn("product", "price_ala_carte", "DOUBLE DEFAULT 0");
            safeAddColumn("product", "price_ala_carte2", "DOUBLE DEFAULT 0");
            safeAddColumn("product", "price1_liter", "DOUBLE DEFAULT 0");
            safeAddColumn("product", "price1_point5_liter", "DOUBLE DEFAULT 0");
            safeAddColumn("product", "price2_liter", "DOUBLE DEFAULT 0");
            safeAddColumn("product", "flavors", "VARCHAR(255)");
            safeAddColumn("product", "image_url", "VARCHAR(500)");
            safeAddColumn("product", "category", "VARCHAR(100)");
            safeAddColumn("product", "out_of_stock", "BOOLEAN DEFAULT FALSE");

            // Ensure out_of_stock is defaulted so inserts without it won't fail
            try {
                jdbcTemplate.execute("ALTER TABLE product MODIFY COLUMN out_of_stock BOOLEAN NOT NULL DEFAULT FALSE");
            } catch (Exception e1) {
                try {
                    jdbcTemplate.execute("ALTER TABLE product ALTER COLUMN out_of_stock SET DEFAULT FALSE");
                } catch (Exception ignored) {}
            }

            // If legacy column 'price' exists, ensure it is nullable so inserts without it won't fail
            try {
                jdbcTemplate.execute("ALTER TABLE product MODIFY COLUMN price DOUBLE NULL");
            } catch (Exception ignored) {}

            // 3. Ensure table 'product_combos' exists for Product @ElementCollection customCombos
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS product_combos (
                    product_id BIGINT NOT NULL,
                    name VARCHAR(255),
                    price DOUBLE,
                    INDEX idx_product_combos_pid (product_id),
                    CONSTRAINT fk_product_combos FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """);

            log.info("Database schema consistency check completed successfully.");
        } catch (Exception e) {
            log.warn("DatabaseInitializer notice: {}", e.getMessage());
        }
    }

    private void safeAddColumn(String table, String column, String definition) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
                Integer.class, table, column
            );
            if (count != null && count == 0) {
                jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
                log.info("Added column {}.{} to database", table, column);
            }
        } catch (Exception e) {
            try {
                jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS " + column + " " + definition);
            } catch (Exception ignored) {}
        }
    }
}

