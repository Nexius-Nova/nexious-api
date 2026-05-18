#!/usr/bin/env bash
# ============================================
# Nexious API — 部署脚本
# 用法: bash deploy.sh
# 首次部署: bash deploy.sh --first
# ============================================
set -euo pipefail

PROJECT_DIR="/opt/nexious-api"
FIRST_RUN=false

if [[ "${1:-}" == "--first" ]]; then
  FIRST_RUN=true
fi

echo "🚀 Starting deployment..."

# ---------- 1. 拉取最新代码 ----------
cd "$PROJECT_DIR"
git pull origin main

# ---------- 2. 安装依赖 ----------
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# ---------- 3. 构建前端 ----------
echo "🏗️  Building frontend..."
cd "$PROJECT_DIR/frontend"
pnpm build

# ---------- 4. 配置后端环境 ----------
cd "$PROJECT_DIR/backend"

# 首次部署：从模板创建 .env
if [ "$FIRST_RUN" = true ] && [ ! -f .env ]; then
  if [ -f .env.production ]; then
    cp .env.production .env
    echo "⚠️  已创建 backend/.env，请编辑填入真实密码后重新运行 bash deploy.sh"
    exit 0
  fi
fi

# ---------- 5. Prisma ----------
echo "🗄️  Generating Prisma client..."
npx prisma generate

echo "🗄️  Pushing database schema..."
npx prisma db push

# ---------- 6. 构建后端 ----------
echo "🏗️  Building backend..."
pnpm build

# ---------- 7. 重启服务 ----------
cd "$PROJECT_DIR"
if pm2 list | grep -q "nexious-api"; then
  echo "🔄 Restarting PM2..."
  pm2 restart ecosystem.config.cjs
else
  echo "🆕 Starting PM2..."
  pm2 start ecosystem.config.cjs
  pm2 save
fi

echo "✅ Deployment complete!"
pm2 status
