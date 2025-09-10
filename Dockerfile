# Multi-stage build for YesChef Application
FROM node:18-alpine AS base

# Install dependencies for both frontend and backend
WORKDIR /app
COPY food-ai/package*.json ./
RUN npm ci --only=production

# Frontend build stage
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY food-ai/package*.json ./
RUN npm ci
COPY food-ai/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy backend dependencies and source
COPY --from=base /app/node_modules ./node_modules
COPY food-ai/package*.json ./
COPY food-ai/server-clean.mjs ./
COPY food-ai/src ./src

# Copy built frontend
COPY --from=frontend-build /app/build ./public

# Create a simple static file server that also serves the API
COPY food-ai/package*.json ./
RUN npm ci --only=production

EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/health || exit 1

CMD ["node", "server-clean.mjs"]
