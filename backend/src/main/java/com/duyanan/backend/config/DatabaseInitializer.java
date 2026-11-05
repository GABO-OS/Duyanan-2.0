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
        log.info("Checking database schema consistency for product and product_combos...");

        // 1. Ensure table 'product' exists
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS product (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255),
                    price_solo DOUBLE DEFAULT 0,
                    price_ala_carte DOUBLE DEFAULT 0,
                    price_ala_carte2 DOUBLE DEFAULT 0,
                    price1_liter DOUBLE DEFAULT 0,
                    price1_point5_liter DOUBLE DEFAULT 0,
                    price2_liter DOUBLE DEFAULT 0,
                    description TEXT,
                    image_url VARCHAR(500),
                    category VARCHAR(100),
                    flavors VARCHAR(255),
                    out_of_stock BOOLEAN NOT NULL DEFAULT FALSE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """);
        } catch (Exception e) {
            log.warn("Notice creating product table: {}", e.getMessage());
        }

        // 2. Safe addition of columns in case the table existed from an older version
        safeAddColumn("product", "price_solo", "DOUBLE DEFAULT 0");
        safeAddColumn("product", "price_ala_carte", "DOUBLE DEFAULT 0");
        safeAddColumn("product", "price_ala_carte2", "DOUBLE DEFAULT 0");
        safeAddColumn("product", "priceala_carte", "DOUBLE DEFAULT 0");
        safeAddColumn("product", "priceala_carte2", "DOUBLE DEFAULT 0");
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

        // 3. Ensure table 'product_combos' exists with a PRIMARY KEY (required by cloud MySQL / DigitalOcean / Aiven)
        ensureProductCombosTable();

        log.info("Database schema consistency check completed successfully.");
    }

    public void ensureProductCombosTable() {
        // Option A: ID primary key (satisfies sql_require_primary_key=ON)
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS product_combos (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    product_id BIGINT NOT NULL,
                    name VARCHAR(255),
                    price DOUBLE DEFAULT 0,
                    INDEX idx_product_combos_pid (product_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """);
            log.info("Ensured product_combos table exists (with id PK).");
            return;
        } catch (Exception e) {
            log.warn("Could not create product_combos with id PK: {}", e.getMessage());
        }

        // Option B: Composite primary key
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS product_combos (
                    product_id BIGINT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    price DOUBLE DEFAULT 0,
                    PRIMARY KEY (product_id, name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """);
            log.info("Ensured product_combos table exists (with composite PK).");
            return;
        } catch (Exception e) {
            log.warn("Could not create product_combos with composite PK: {}", e.getMessage());
        }

        // Option C: Without primary key
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS product_combos (
                    product_id BIGINT NOT NULL,
                    name VARCHAR(255),
                    price DOUBLE DEFAULT 0
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """);
            log.info("Ensured product_combos table exists (without PK).");
        } catch (Exception ex) {
            log.error("Notice: could not create product_combos table: {}", ex.getMessage());
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
