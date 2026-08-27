# 前后端接口契约

API 前缀：`/api/v1`。前端通过 `VITE_API_BASE_URL` 指定后端地址。

| 方法 | 路径 | 权限 | 用途 |
| --- | --- | --- | --- |
| GET | `/health` | 公开 | 服务健康检查 |
| GET | `/config` | 公开 | 上传限制和 AI 模式 |
| GET | `/categories` | 公开 | 17 个展示分类 |
| GET | `/stats` | 公开 | 总数及 16 连排行榜 |
| GET | `/media` | 公开 | 公开素材查询 |
| POST | `/media/:id/like` | 公开 | 点赞 |
| POST | `/auth/uploader` | 公开 | 姓名与分类验证 |
| POST | `/media` | 上传凭证 | 批量上传素材 |
| POST | `/auth/admin` | 公开 | 管理员登录 |
| GET | `/admin/media` | 管理员 | 查看含审计字段的素材 |
| GET | `/admin/export` | 管理员 | 按检索条件打包下载原始素材与 CSV 清单 |
| PATCH | `/admin/media/:id` | 管理员 | 精选、隐藏或恢复 |
| POST | `/admin/media/:id/ai` | 管理员 | AI 文案演示 |
| DELETE | `/admin/media/:id` | 管理员 | 删除素材 |

公开素材响应禁止包含上传者姓名。上传凭证和管理员凭证均通过 `Authorization: Bearer <token>` 发送。

`MediaItem.thumbnailUrl` 为上传照片的 1080px WebP 缩略图（sharp 在上传时生成，修正 EXIF 方向），视频和 `/demo/` 演示图为 `null`；前端列表网格优先使用缩略图，灯箱与大屏使用原图 `url`。

## 管理员检索导出

`GET /admin/export` 支持以下可选查询参数：

- `categoryId`：`1` 至 `17`；省略时导出全部连队与工作人员素材。
- `status`：`public` 或 `hidden`；省略时包含公开与隐藏素材。
- `q`：匹配原始文案、AI 文案、上传者、分类名称、素材 URL 或素材 ID。

接口只导出未删除素材，以 ZIP 流返回。原始文件按分类建立目录，压缩包根目录包含 UTF-8 BOM 编码的 `素材清单.csv`，用于核对上传者、状态、精选、点赞数和文件可用性。当前条件无结果时返回 `404`。
