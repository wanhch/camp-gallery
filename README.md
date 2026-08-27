# Camp Gallery

2026中科曙光集团应届生训战营 · 黄埔八期影像汇聚与展示平台。

> 荣聚曙光，梦想启航

## 工程结构

- `frontend/`：React 19 + TypeScript + Vite，独立开发和构建。
- `backend/`：Express 5 + SQLite，独立开发、测试和部署。
- `docs/`：需求基线与前后端 API 契约。

## 国内镜像

本机 npm 已配置为 `https://registry.npmmirror.com`。新环境可执行：

```bash
npm config set registry https://registry.npmmirror.com
```

## 安装与启动

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
npm run dev
```

- 前端：`http://localhost:5173`
- 后端：`http://localhost:8787`
- 上传：`http://localhost:5173/upload`
- 观看：`http://localhost:5173/gallery`
- 管理：`http://localhost:5173/admin`
- 大屏：`http://localhost:5173/screen`
- 连队详情示例：`http://localhost:5173/company/10`
- 工作人员专区：`http://localhost:5173/staff`

初始管理员密码按需求设为 `sugonhygon`。公网部署前必须在 `backend/.env` 中配置新的 `AUTH_SECRET`，密码和密钥均不得提交到 GitHub。

## 验证

```bash
npm run check
npm run build
# 后端运行时：
npm --prefix backend run test:smoke
```

冒烟测试覆盖名单验证、错误身份拒绝、真实上传、公开隐私、管理员审计、检索导出、精选、隐藏、AI 演示和测试素材清理。

## 数据

- SQLite：`backend/storage/camp-gallery.db`
- 上传文件：`backend/storage/media/`
- 两者均被 Git 忽略，部署时必须挂载持久化磁盘。

详细需求见 [`docs/requirements.md`](docs/requirements.md)，接口见 [`docs/api.md`](docs/api.md)。
