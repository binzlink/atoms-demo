# Atoms Demo

一个公开的网页工作室：用一句话生成可交互的自包含页面，在右侧预览，满意后发布。

## 范围

- 首页用一句话创建项目，并列出全部项目。任何人都可以打开和修改。
- 生成使用 Cloudflare Workers AI。左侧显示简短说明，右侧预览页面。
- 当前稿和已发布版本分开保存。发布地址是 `https://ai111.ai/p/` 加上项目 id。
- 工作室里可以删除项目。删除后发布地址返回 404。
- 不做登录，也不做多人协同。

## 结构

- `apps/web`：Vite + React，部署到 Cloudflare Pages，域名 `ai111.ai`
- `apps/api`：Worker + D1，接口在 `api.ai111.ai`，发布页由同一 Worker 接管 `ai111.ai/p/*`
- `packages/shared`：前后端共用的类型

## 本地运行

```bash
pnpm install
pnpm --filter @atoms/api db:local
pnpm dev
```

打开 `http://127.0.0.1:5173`。接口在 `http://127.0.0.1:8787`，模型调用走账号里的 Workers AI。

实现取舍、完成范围和后续优先级写在 [说明.md](说明.md)。
