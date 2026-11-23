# Multi-stage Dockerfile for VivoQuest Modular Monolith Backend
# Node.js 22 LTS on Google Cloud Run

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig*.json ./
RUN npm ci

COPY src/ ./src/
COPY database/ ./database/
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --chown=nestjs:nodejs package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist

USER nestjs

EXPOSE 8080

CMD ["node", "dist/main.js"]
