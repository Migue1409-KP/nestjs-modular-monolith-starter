# ─── Build stage ────────────────────────────────────────────────────────────
FROM node:25-alpine AS builder

WORKDIR /app

# --ignore-scripts: the `prepare` script (husky) is dev-only and there is no git repo here.
COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ─── Production stage ────────────────────────────────────────────────────────
FROM node:25-alpine AS production

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    API_PREFIX=api/v1

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist
# PolicyService reads config/authorization.yaml at runtime (relative to the working directory).
COPY config ./config

# Run as the unprivileged `node` user; Winston writes its files to ./logs.
RUN mkdir -p logs && chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO /dev/null "http://127.0.0.1:${PORT}/${API_PREFIX}/health" || exit 1

CMD ["node", "dist/main"]
