package com.duyanan.backend.service;

import com.duyanan.backend.model.Product;
import com.duyanan.backend.model.ProductCombo;
import com.duyanan.backend.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.util.*;

@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final JdbcTemplate jdbcTemplate;

    public ProductService(ProductRepository productRepository, JdbcTemplate jdbcTemplate) {
        this.productRepository = productRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Ensures table product_combos exists with a PRIMARY KEY to satisfy
     * cloud MySQL requirements (DigitalOcean / Aiven sql_require_primary_key=ON).
     */
    public void ensureProductCombosTable() {
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
        } catch (Exception e1) {
            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS product_combos (
                        product_id BIGINT NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        price DOUBLE DEFAULT 0,
                        PRIMARY KEY (product_id, name)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """);
            } catch (Exception e2) {
                try {
                    jdbcTemplate.execute("""
                        CREATE TABLE IF NOT EXISTS product_combos (
                            product_id BIGINT NOT NULL,
                            name VARCHAR(255),
                            price DOUBLE DEFAULT 0
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                    """);
                } catch (Exception ignored) {}
            }
        }
    }

    /**
     * Converts a JPA Product entity to a detached, safe LinkedHashMap.
     * Guaranteed never to throw LazyInitializationException during JSON serialization.
     */
    public Map<String, Object> productToMap(Product p) {
        if (p == null) return null;
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId());
        map.put("name", p.getName());
        map.put("priceSolo", p.getPriceSolo());
        map.put("priceALaCarte", p.getPriceALaCarte());
        map.put("priceALaCarte2", p.getPriceALaCarte2());
        map.put("price1Liter", p.getPrice1Liter());
        map.put("price1Point5Liter", p.getPrice1Point5Liter());
        map.put("price2Liter", p.getPrice2Liter());
        map.put("description", p.getDescription());
        map.put("imageUrl", p.getImageUrl());
        map.put("category", p.getCategory());
        map.put("flavors", p.getFlavors());
        map.put("outOfStock", p.isOutOfStock());

        List<Map<String, Object>> combos = new ArrayList<>();
        if (p.getCustomCombos() != null) {
            try {
                for (ProductCombo c : p.getCustomCombos()) {
                    if (c != null) {
                        Map<String, Object> cm = new LinkedHashMap<>();
                        cm.put("name", c.getName() != null ? c.getName() : "");
                        cm.put("price", c.getPrice() != null ? c.getPrice() : 0.0);
                        combos.add(cm);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not load combos for product {}: {}", p.getId(), e.getMessage());
            }
        }
        map.put("customCombos", combos);
        return map;
    }

    /**
     * Fetches all products. Uses JPA first, falls back to direct JdbcTemplate
     * if JPA throws any ORM or lazy initialization error.
     */
    public List<Map<String, Object>> getAllProducts() {
        ensureProductCombosTable();
        try {
            List<Product> products = productRepository.findAll();
            List<Map<String, Object>> result = new ArrayList<>();
            for (Product p : products) {
                result.add(productToMap(p));
            }
            return result;
        } catch (Throwable t) {
            log.error("JPA findAll failed, falling back to JdbcTemplate: {}", t.getMessage());
            return getProductsViaJdbc(null);
        }
    }

    /**
     * Fetches a single product by ID with fallback.
     */
    public Map<String, Object> getProductById(Long id) {
        ensureProductCombosTable();
        try {
            Optional<Product> opt = productRepository.findById(id);
            if (opt.isPresent()) {
                return productToMap(opt.get());
            }
        } catch (Throwable t) {
            log.warn("JPA findById({}) failed, trying JdbcTemplate: {}", id, t.getMessage());
        }

        List<Map<String, Object>> fallback = getProductsViaJdbc(id);
        return fallback.isEmpty() ? null : fallback.get(0);
    }

    /**
     * Updates an existing product. Ensures product_combos table exists,
     * tries JPA update first, and seamlessly falls back to direct JDBC update if JPA fails.
     */
    public Map<String, Object> updateProduct(Long id, Product product) {
        ensureProductCombosTable();

        // 1. Try JPA update
        try {
            Optional<Product> opt = productRepository.findById(id);
            if (opt.isPresent()) {
                Product existing = opt.get();
                existing.setName(product.getName());
                existing.setPriceSolo(product.getPriceSolo());
                existing.setPriceALaCarte(product.getPriceALaCarte());
                existing.setPriceALaCarte2(product.getPriceALaCarte2());
                existing.setPrice1Liter(product.getPrice1Liter());
                existing.setPrice1Point5Liter(product.getPrice1Point5Liter());
                existing.setPrice2Liter(product.getPrice2Liter());
                existing.setDescription(product.getDescription());
                if (product.getImageUrl() != null) {
                    existing.setImageUrl(product.getImageUrl());
                }
                existing.setCategory(product.getCategory());
                existing.setFlavors(product.getFlavors());
                existing.setOutOfStock(product.isOutOfStock());

                if (product.getCustomCombos() != null) {
                    try {
                        existing.getCustomCombos().clear();
                        existing.getCustomCombos().addAll(product.getCustomCombos());
                    } catch (Exception ignored) {}
                }

                Product saved = productRepository.save(existing);
                return productToMap(saved);
            }
        } catch (Throwable t) {
            log.warn("JPA update failed for product {}, falling back to JDBC: {}", id, t.getMessage());
        }

        // 2. Direct JDBC update fallback
        try {
            String updateSql = "UPDATE product SET name = ?, description = ?, image_url = ?, category = ?, " +
                    "flavors = ?, out_of_stock = ?, price_solo = ?, price_ala_carte = ?, price_ala_carte2 = ?, " +
                    "price1_liter = ?, price1_point5_liter = ?, price2_liter = ? WHERE id = ?";

            int updated = jdbcTemplate.update(updateSql,
                    product.getName(),
                    product.getDescription(),
                    product.getImageUrl(),
                    product.getCategory(),
                    product.getFlavors(),
                    product.isOutOfStock(),
                    product.getPriceSolo() != null ? product.getPriceSolo() : 0.0,
                    product.getPriceALaCarte() != null ? product.getPriceALaCarte() : 0.0,
                    product.getPriceALaCarte2() != null ? product.getPriceALaCarte2() : 0.0,
                    product.getPrice1Liter() != null ? product.getPrice1Liter() : 0.0,
                    product.getPrice1Point5Liter() != null ? product.getPrice1Point5Liter() : 0.0,
                    product.getPrice2Liter() != null ? product.getPrice2Liter() : 0.0,
                    id
            );

            // Also update legacy column names if present
            try {
                jdbcTemplate.update("UPDATE product SET priceala_carte = ?, priceala_carte2 = ? WHERE id = ?",
                        product.getPriceALaCarte() != null ? product.getPriceALaCarte() : 0.0,
                        product.getPriceALaCarte2() != null ? product.getPriceALaCarte2() : 0.0,
                        id
                );
            } catch (Exception ignored) {}

            // Update combos
            if (product.getCustomCombos() != null) {
                try {
                    jdbcTemplate.update("DELETE FROM product_combos WHERE product_id = ?", id);
                    for (ProductCombo c : product.getCustomCombos()) {
                        if (c != null && c.getName() != null && !c.getName().isBlank()) {
                            jdbcTemplate.update(
                                    "INSERT INTO product_combos (product_id, name, price) VALUES (?, ?, ?)",
                                    id, c.getName(), c.getPrice() != null ? c.getPrice() : 0.0
                            );
                        }
                    }
                } catch (Exception ignored) {}
            }

            if (updated > 0) {
                return getProductById(id);
            }
        } catch (Exception e) {
            log.error("JDBC update failed for product {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to update product: " + e.getMessage(), e);
        }

        return null;
    }

    /**
     * Deletes a product. Ensures product_combos exists, cleans up combos,
     * and deletes the product record using JPA with JDBC fallback.
     */
    public boolean deleteProduct(Long id) {
        ensureProductCombosTable();

        // 1. Delete associated combos first
        try {
            jdbcTemplate.update("DELETE FROM product_combos WHERE product_id = ?", id);
        } catch (Exception ignored) {}

        // 2. Try JPA delete
        try {
            productRepository.deleteById(id);
            return true;
        } catch (Throwable t) {
            log.warn("JPA deleteById({}) failed, trying JDBC delete: {}", id, t.getMessage());
        }

        // 3. Fallback direct JDBC delete
        try {
            int rows = jdbcTemplate.update("DELETE FROM product WHERE id = ?", id);
            return rows > 0;
        } catch (Exception e) {
            log.error("JDBC delete failed for product {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to delete product: " + e.getMessage(), e);
        }
    }

    /**
     * Fallback JDBC query that bypasses Hibernate completely.
     */
    private List<Map<String, Object>> getProductsViaJdbc(Long filterId) {
        try {
            String sql = filterId != null
                    ? "SELECT * FROM product WHERE id = ?"
                    : "SELECT * FROM product ORDER BY id ASC";

            Object[] params = filterId != null ? new Object[]{filterId} : new Object[]{};

            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", rs.getLong("id"));
                map.put("name", rs.getString("name"));
                map.put("description", rs.getString("description"));
                map.put("imageUrl", rs.getString("image_url"));
                map.put("category", rs.getString("category"));
                map.put("flavors", rs.getString("flavors"));

                map.put("priceSolo", getSafeDouble(rs, "price_solo"));
                map.put("priceALaCarte", getSafeDouble(rs, "price_ala_carte", "priceala_carte"));
                map.put("priceALaCarte2", getSafeDouble(rs, "price_ala_carte2", "priceala_carte2"));
                map.put("price1Liter", getSafeDouble(rs, "price1_liter"));
                map.put("price1Point5Liter", getSafeDouble(rs, "price1_point5_liter"));
                map.put("price2Liter", getSafeDouble(rs, "price2_liter"));

                boolean oos = false;
                try {
                    oos = rs.getBoolean("out_of_stock");
                } catch (Exception ignored) {}
                map.put("outOfStock", oos);

                long pid = rs.getLong("id");
                List<Map<String, Object>> combos = new ArrayList<>();
                try {
                    combos = jdbcTemplate.query(
                        "SELECT name, price FROM product_combos WHERE product_id = ?",
                        (crs, crn) -> {
                            Map<String, Object> cm = new LinkedHashMap<>();
                            cm.put("name", crs.getString("name") != null ? crs.getString("name") : "");
                            cm.put("price", crs.getDouble("price"));
                            return cm;
                        },
                        pid
                    );
                } catch (Exception ignored) {}
                map.put("customCombos", combos);

                return map;
            }, params);
        } catch (Exception e) {
            log.error("JdbcTemplate getProductsViaJdbc error: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private Double getSafeDouble(ResultSet rs, String... colNames) {
        for (String col : colNames) {
            try {
                double val = rs.getDouble(col);
                if (!rs.wasNull()) {
                    return val;
                }
            } catch (Exception ignored) {}
        }
        return 0.0;
    }
}
