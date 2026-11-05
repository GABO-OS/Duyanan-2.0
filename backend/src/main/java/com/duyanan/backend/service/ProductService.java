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

