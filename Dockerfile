FROM node:20-alpine AS base

# 1. 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. 构建项目
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 显式生成 Prisma Client
RUN npx prisma generate
RUN npm run build

# 3. 运行环境
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 安装 openssl 和 sqlite (Prisma 运行引擎和数据库操作需要)
RUN apk add --no-cache openssl sqlite

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# 复制完整的 Prisma CLI 和引擎 (standalone 模式默认剔除了这些)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p /app/data /app/backups && chown -R nextjs:nodejs /app/data /app/backups

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV DATABASE_URL "file:/app/data/db.sqlite"

# 直接使用 node 运行 prisma 脚本，绕过可能失效的 .bin 软链接
CMD node node_modules/prisma/build/index.js db push && node server.js