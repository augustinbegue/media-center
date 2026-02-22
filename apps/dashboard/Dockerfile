# syntax=docker/dockerfile:1

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# Install bun
RUN npm install -g bun@latest

# Copy workspace files
COPY package.json bun.lockb* ./
COPY packages/shared ./packages/shared
COPY apps/dashboard ./apps/dashboard

# Install all deps
RUN bun install --frozen-lockfile

# Build
RUN cd apps/dashboard && bun run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/dashboard/build ./build
COPY --from=builder /app/apps/dashboard/package.json ./

EXPOSE 3000

CMD ["node", "build"]
