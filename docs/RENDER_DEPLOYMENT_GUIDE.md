# 🚀 Render Deployment & Environment Variable Guide

> **Notice for Developers & AI Assistants working on Duyanan 2.0:**  
> This guide outlines critical environment variables and configuration needed in the **Render Dashboard** to ensure zero-delay container wake-ups and working password reset emails.

---

## 📌 1. Essential Render Backend Environment Variables

Configure these key-value pairs in **Render Dashboard** -> **duyanan-backend** (or your backend Web Service) -> **Environment**:

| Environment Variable | Recommended Production Value | Description & Why It's Critical |
| :--- | :--- | :--- |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `none` | **Prevents 5–15s cold boot delay.** In production, avoids running DDL table inspections against cloud MySQL on every wake-up. |
| `SHOW_SQL` | `false` | Disables printing thousands of SQL statements to Render logs, preventing container I/O throttling. |
| `FRONTEND_URL` | `https://<your-frontend-service>.onrender.com` | **Fixes password reset links.** If missing, links will point to `http://localhost:5173/reset-password?token=...`. |
| `MAIL_USERNAME` | `duyanankainan@gmail.com` | Gmail account used for sending outgoing password reset emails. |
| `MAIL_PASSWORD` | *(16-character Google App Password)* | **Fixes broken Forgot Password.** Must be an App Password, **NOT** the account password (see setup below). |
| `JAVA_OPTS` | *(Already pre-configured in Dockerfile)* | Can be overridden in Render if custom heap sizing is needed. |

---

## 🔑 2. How to Generate Google App Password for `MAIL_PASSWORD`

Gmail blocks direct password authentication over SMTP port 587. You must generate an App Password:

1. Log into Google Account: **`duyanankainan@gmail.com`**.
2. Go to **Google Account Settings** -> **Security** ([myaccount.google.com/security](https://myaccount.google.com/security)).
3. Under *"How you sign in to Google"*, ensure **2-Step Verification** is turned **ON**.
4. In the top search bar inside Google Account, search for **`App passwords`** (or visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
5. In the App name field, enter: `Duyanan Production Render`.
6. Click **Create**.
7. Google will display a 16-character code (e.g. `abcd efgh ijkl mnop`).
8. Copy the code (without spaces) and paste it into Render Environment as:
   ```env
   MAIL_PASSWORD=abcdefghijklmnop
   ```
9. Trigger a redeploy of the backend service.

---

## ⚡ 3. Optimizations Applied to Codebase

The following code-level enhancements are permanently baked into the repository:

### Backend Optimizations
1. **Dockerfile Container Tuning (`backend/Dockerfile`):**
   - `-XX:+TieredCompilation -XX:TieredStopAtLevel=1`: Restricts JIT to the C1 compiler, avoiding C2 compiler CPU starvation on Render's 0.1 shared vCPU. Drops cold startup by 30–50 seconds.
   - `-Xss256k`: Halves per-thread stack memory to preserve heap in the 512MB RAM container.
   - `-XX:MaxRAMPercentage=75.0`: Informs JVM cgroups to prevent container OOM killer.
2. **HikariCP Connection Pool (`DataSourceConfig.java` & `application.properties`):**
   - Pool size capped at `maximumPoolSize=5`, `minimumIdle=2`, `keepaliveTime=30000ms`, `connectionTimeout=10000ms`.
   - Prevents exhausted connection limits on free-tier MySQL providers (TiDB / Aiven / Clever Cloud).
3. **Static Asset Caching (`WebConfig.java`):**
   - Configured `CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic()` for all `/uploads/**` files.
4. **Lightweight Health Check (`HealthController.java` & `SecurityConfig.java`):**
   - `GET /api/health` returns `{"status":"UP"}` without database overhead. Publicly accessible if developers choose to configure uptime monitoring in the future.
5. **Email Normalization & Detailed Logging (`UserController.java`):**
   - `forgotPassword()` automatically trims and lowercases email input before querying MySQL, matching the registration format.
   - Any SMTP connection or authentication failures are logged to stdout with full stack context for instant debugging.

### Frontend Optimizations
1. **Route Code-Splitting (`frontend/src/App.jsx`):**
   - All pages (`AdminPanel.jsx` [181 KB], `Menu.jsx`, `Profile.jsx`, etc.) are dynamically imported via `React.lazy()` with `<Suspense>`.
   - Initial landing page download reduced from ~1.5 MB to ~250 KB.
2. **Axios Timeout & Warm-up Notice (`Menu.jsx`, `GroupMeals.jsx`, `EventPackages.jsx`):**
   - Configured 15-second request timeouts to prevent indefinite spinners.
   - Added friendly warm-up banner after 3.5 seconds informing users if the cloud server is waking up.
   - Added manual "Check Server" retry button with offline fallback items.
3. **WebP Asset Optimization:**
   - All large PNG/JPG hero and event images converted to modern WebP format (slashing asset weights by up to 94%).
   - Added `loading="lazy"` and `decoding="async"` to all below-the-fold image elements.
