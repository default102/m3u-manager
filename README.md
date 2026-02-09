# M3U 订阅管理器 (M3U Manager)

一个轻量级、美观且响应式的 M3U 节目列表管理工具。支持分组编辑、拖拽排序、批量管理及自动订阅导出。

## 🌟 核心功能

- **多端兼容**：适配手机、平板和电脑浏览器。
- **灵活导入**：支持通过远程 URL 或本地 `.m3u` 文件导入/更新列表。
- **分组管理**：自动识别分组顺序，支持创建新分组及分组间的拖拽排序。
- **批量操作**：支持勾选多个频道进行批量移动分组或一键删除。
- **订阅导出**：为每个列表生成固定的 M3U 链接，支持播放器直接订阅。
- **覆盖更新**：支持重新导入文件以覆盖现有内容，同时保留列表 ID。

## 🚀 快速开始

### Docker 部署 (推荐)

这是最简单且推荐的部署方式，支持数据持久化。

1. **使用 Docker Compose 一键启动**：
   在项目根目录下运行：
   ```bash
   docker-compose up -d
   ```

2. **手动运行 Docker 容器**：
   如果您不想使用 Compose，可以使用以下命令：
   ```bash
   # 构建镜像
   docker build -t m3u-manager .

   # 运行容器 (挂载本地 data 目录以保存数据库)
   docker run -d \
     -p 3000:3000 \
     -v $(pwd)/data:/app/data \
     --name m3u-app \
     m3u-manager
   ```

> **注意**：挂载 `-v $(pwd)/data:/app/data` 非常重要，否则容器重启后您的数据将会丢失。

### 本地开发

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **初始化数据库**：
   ```bash
   npx prisma db push
   ```

3. **启动服务**：
   ```bash
   npm run dev
   ```
   访问 [http://localhost:3000](http://localhost:3000)。

## 🛡️ 安全建议

本工具设计初衷为私有环境使用，**未内置登录鉴权**。若部署在公网，强烈建议：
1. 使用 Nginx/Caddy 配置 **Basic Auth**。
2. 仅在局域网或通过 VPN (如 Tailscale) 访问。

## 📝 订阅地址格式

导出链接：`http://<您的服务器IP>:3000/api/export/<列表ID>`

## 开源协议

MIT
