# ==============================================================================
# NOVA Gaming Platform - Player Web Frontend (PWA) Dockerfile
# ==============================================================================

# Stage 1: Build the Progressive Web App
FROM node:20-alpine AS builder

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.0.0

ARG VITE_API_URL
ARG VITE_SOCKET_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/ ./packages/
COPY games/ ./games/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY apps/web/ ./apps/web/

RUN pnpm --filter @nova/web run build

# Stage 2: Serve static PWA with unprivileged Nginx
FROM nginxinc/nginx-unprivileged:alpine AS runner

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Expose standard unprivileged port
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
