# Multi-stage build using Chainguard base
# Chainguard images are minimal, distroless, and CVE-free
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install production dependencies only, then all for build
RUN npm ci --only=production && \
    cp -R node_modules prod_modules && \
    npm ci

# Copy source code
COPY . .

# Build frontend and backend
RUN npm run build

# Production stage - minimal runtime image
FROM cgr.dev/chainguard/node:latest

WORKDIR /app

# Copy only production node_modules (smaller image)
COPY --from=builder /app/prod_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Copy certs for HTTPS
COPY --from=builder /app/certs ./certs

# Runtime configuration
ENV NODE_ENV=production
ENV PORT=8080
ENV HTTPS_PORT=8443
ENV ENABLE_HTTPS=true

# Expose ports (HTTP redirects to HTTPS)
EXPOSE 8080 8443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 301 || r.statusCode === 200 ? 0 : 1)})"

# Chainguard node image has node as ENTRYPOINT
CMD ["dist/server/index.js"]
