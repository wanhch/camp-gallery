# 曙光新星 · 集训纪实

面向中科曙光应届生实训的照片、视频汇聚与连队风采展示平台。包含 736 学员光点与 16 连队节点组成的实时 Canvas 集结场、连续滚动旅程、随机连队聚光、官方内容入口、移动端优先布局、媒体筛选、照片/视频上传、点赞、大图浏览、Web Share 与动态二维码。

动态场景提供显式暂停控制并遵循 `prefers-reduced-motion`。Sugon 纸飞机光标只在精细指针设备上启用，触屏设备保留系统交互。

## 本地运行

```bash
npm install
npm run dev
```

- 网站：`http://localhost:5173`
- API：`http://localhost:8787`

首次启动 API 时会自动创建 `storage/sugon-stars.db`，并将演示数据写入 SQLite。用户上传文件保存在 `storage/media/`。

## 生产运行

```bash
npm run build
npm start
```

生产服务默认监听 `8787`，同时提供 API、上传文件和构建后的前端。

## 环境变量

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `PORT` | `8787` | 生产服务端口 |
| `UPLOAD_CODE` | 空 | 设置后，上传时必须填写共享集训口令 |
| `MAX_FILE_MB` | `120` | 单个文件最大体积 |

公网部署时应把 `storage/` 挂载到持久化磁盘，并在反向代理层配置 HTTPS、请求频率限制与文件体积上限。二维码始终使用访问者当前打开的网站地址，无需额外配置。

## 上线替换

`public/demo/` 为可替换的演示照片，`public/official/` 保存带来源说明的公开内容封面。完整来源见 `public/demo/CREDITS.md`。正式发布前请替换为已获得参与者授权的真实素材，并将头部文字标识替换为内部提供的官方 Sugon SVG 品牌文件。
