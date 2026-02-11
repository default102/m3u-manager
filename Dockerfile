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
# 合并 Prisma 生成和构建命令
RUN npx prisma generate && npm run build

# 3. 运行环境
FROM base AS runner
WORKDIR /app

# 合并所有环境变量为一层
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    DATABASE_URL="file:/app/data/db.sqlite"

# 合并所有系统操作为一层（安装依赖、创建用户、创建目录）
RUN apk add --no-cache openssl sqlite && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/data/backups && \
    chown -R nextjs:nodejs /app/data

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 Prisma 文件
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# 直接使用 node 运行 prisma 脚本，绕过可能失效的 .bin 软链接
CMD node node_modules/prisma/build/index.js db push && node server.js