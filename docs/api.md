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
| PATCH | `/admin/media/:id` | 管理员 | 精选、隐藏或恢复 |
| POST | `/admin/media/:id/ai` | 管理员 | AI 文案演示 |
| DELETE | `/admin/media/:id` | 管理员 | 删除素材 |

公开素材响应禁止包含上传者姓名。上传凭证和管理员凭证均通过 `Authorization: Bearer <token>` 发送。
