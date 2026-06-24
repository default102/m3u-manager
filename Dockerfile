FROM node:20-alpine AS base

# 1. 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# 2. 构建项目
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# 集中整理归拢运行时产物
RUN mkdir -p /app/out && \
    cp -r /app/public /app/out/public && \
    cp -r /app/.next/standalone/. /app/out/ && \
    mkdir -p /app/out/.next && \
    cp -r /app/.next/static /app/out/.next/static && \
    cp -r /app/prisma /app/out/prisma && \
    mkdir -p /app/out/node_modules && \
    cp -r /app/node_modules/prisma /app/out/node_modules/prisma && \
    cp -r /app/node_modules/@prisma /app/out/node_modules/@prisma

# 3. 运行环境
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    DATABASE_URL="file:/app/data/db.sqlite"

RUN apk add --no-cache openssl sqlite && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/data/backups && \
    chown -R nextjs:nodejs /app/data

# 仅单次 COPY，物理层数减少 5 层
COPY --from=builder --chown=nextjs:nodejs /app/out ./

USER nextjs
EXPOSE 3000

# 直接使用 node 运行 prisma 脚本，绕过可能失效的 .bin 软链接
CMD node node_modules/prisma/build/index.js db push && node server.js