# ==============================================================================
# NOVA Gaming Platform - Backend API Service Dockerfile (Multi-Stage, Non-Root)
# ==============================================================================

# Stage 1: Build workspace
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.0.0

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/ ./packages/
COPY games/ ./games/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

COPY apps/api/ ./apps/api/

RUN pnpm --filter @nova/types run build || true
RUN pnpm --filter @nova/logger run build || true
RUN pnpm --filter @nova/validation run build || true
RUN pnpm --filter @nova/fairness run build || true
RUN pnpm --filter @nova/auth run build || true
RUN pnpm --filter @nova/wallet run build || true
RUN pnpm --filter @nova/game-engine run build || true
RUN pnpm --filter @nova/database run db:generate:pg
RUN pnpm --filter @nova/database run build || true
RUN pnpm --filter @nova/api run build

RUN pnpm --filter @nova/api --prod deploy /app/deployed-api

# Stage 2: Minimal Secure Production Runtime (Non-root)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN apk add --no-cache curl

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nova
USER nova

COPY --from=builder --chown=nova:nodejs /app/deployed-api ./
COPY --from=builder --chown=nova:nodejs /app/packages/database/prisma ./prisma
COPY --from=builder --chown=nova:nodejs /app/apps/api/dist ./dist

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "dist/server.js"]
