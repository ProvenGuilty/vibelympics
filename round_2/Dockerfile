# Multi-stage build using Chainguard base
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend and backend
RUN npm run build

# Production stage
FROM cgr.dev/chainguard/node:latest

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy certs (permissions fixed in builder stage)
COPY --from=builder /app/certs ./certs

ENV NODE_ENV=production
ENV PORT=8080
ENV HTTPS_PORT=8443
ENV ENABLE_HTTPS=true

# Expose ports (HTTP redirects to HTTPS)
EXPOSE 8080 8443

# Health check (accepts redirect from HTTP or success from HTTPS)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 301 || r.statusCode === 200 ? 0 : 1)})"

# Chainguard node image has node as ENTRYPOINT, so just pass the script
CMD ["dist/server/index.js"]
