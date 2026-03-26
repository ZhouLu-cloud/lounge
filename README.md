# The Lounge (前后端一体)

这个项目现在包含：

- 前端：`React + Vite`
- 后端：`Vercel API Routes`
- 数据库：`Supabase`

## 1) 本地启动

**前置要求**

- Node.js 20+
- 一个 Supabase 项目

**安装依赖**

```bash
npm install
```

**配置环境变量**

复制 `.env.example` 为 `.env.local`，至少填写：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**初始化数据库**

在 Supabase SQL Editor 执行：

- `supabase/schema.sql`

**启动完整前后端（推荐）**

```bash
npm run dev:full
```

这会使用 `vercel dev` 同时运行前端和 `/api/*` 后端路由。

## 2) 已实现的后端接口

- `GET /api/health`
- `GET /api/rooms`
- `POST /api/dice-roll`
- `POST /api/lady-cards-draw`
- `POST /api/poker-join`
- `POST /api/poker-new-hand`
- `POST /api/poker-reveal`

## 3) 推送到 GitHub

```bash
git init
git add .
git commit -m "feat: fullstack lounge with supabase + vercel api"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## 4) 部署到 Vercel

1. 在 Vercel 导入这个 GitHub 仓库
2. Root Directory 选择项目目录（`the-lounge`）
3. 在 Vercel 项目环境变量里配置：
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. 点击 Deploy

也可以命令行部署：

```bash
npm run deploy
```

## 5) 说明

- 前端所有核心游戏逻辑（房间、摇骰子、扑克发牌/翻牌、小姐牌抽牌）已改为请求后端 API。
- API 数据会写入 Supabase 表，具备持久化。
