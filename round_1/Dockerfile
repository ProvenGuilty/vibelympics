# 🐙 Linky's Container Security Dashboard
# Multi-stage build using Chainguard containers for maximum security

# =============================================================================
# Stage 1: Build
# =============================================================================
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Suppress npm warnings from stale Chainguard configs
ENV npm_config_globalignorefile=""
ENV npm_config_python=""

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM cgr.dev/chainguard/node:latest AS production

WORKDIR /app

# Copy only production dependencies and built assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/certs ./certs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HTTPS_PORT=3443
ENV ENABLE_HTTPS=true

# Expose ports (HTTP and HTTPS)
EXPOSE 3000 3443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run as non-root user (default in Chainguard images)
# The node user is already set up in the Chainguard image

# Start the application
CMD ["dist/server/index.js"]
