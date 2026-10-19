# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Cache dependencies first (faster rebuilds)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build the JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ── Stage 2: Run ────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Directory for file uploads (mount as a volume in production)
RUN mkdir -p /app/uploads

EXPOSE 8080

# JVM performance optimization flags for Render free tier (0.1 vCPU / 512MB RAM):
# -XX:+TieredCompilation -XX:TieredStopAtLevel=1: Restricts JIT to C1 compiler, avoiding C2 compiler CPU spikes on startup
# -Xss256k: Halves per-thread stack allocation to conserve container RAM
# -XX:MaxRAMPercentage=75.0: Caps heap usage to prevent container OOM killer
# -Djava.security.egd=file:/dev/./urandom: Fast, non-blocking entropy generation
ENV JAVA_OPTS="-XX:+TieredCompilation -XX:TieredStopAtLevel=1 -Xss256k -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
