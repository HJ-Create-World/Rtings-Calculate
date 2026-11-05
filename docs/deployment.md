# 部署方案

状态：按 P01~P12 确认口径制定。当前是单人本机使用，先本机部署，后续迁到部门内网服务器。

## 1. 部署原则

1. 当前 Web 是纯前端应用，评分核心运行在浏览器内，无后端依赖。
2. 首版不引入账号、数据库和公网服务；保持离线可用。
3. 生产部署必须使用构建产物 `dist/`，不使用 dev server。
4. 数据保存在本机浏览器 localStorage；正式数据以 Excel 导出留档。
5. 后续接入 tvsms 时，通过明确 API 边界集成，不把评分核心耦合进页面。

## 2. 本机部署（当前阶段）

### 方案 A：Node 静态服务（推荐）

适用：工程师本机或部门内网可访问的 Windows 机器。

```powershell
cd D:\01_HJ_Work\00_Person\04_Project\08_Rtings-Calculate
npm ci
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

访问方式：

- 本机：`http://127.0.0.1:4173`
- 内网同事：`http://<本机内网IP>:4173`

注意：

- Windows 防火墙首次可能要求允许 Node.js 访问专用网络。
- 关闭 PowerShell 后服务停止；后续可注册为计划任务或 Windows 服务。
- 当前 `package.json` 的 `preview` 脚本默认绑定 `127.0.0.1`，对外访问需临时加 `--host 0.0.0.0`。

### 方案 B：静态文件 + 简易服务器

把 `dist/` 目录拷贝到任意静态服务器，例如 IIS、Nginx、Caddy 或 `serve`。

当前路由使用 hash 模式（`/#/comparison`），静态服务器无需额外 rewrite 规则。

## 3. 内网服务器部署（下一阶段）

### 推荐方案：Nginx 静态容器

构建产物是静态文件，推荐用轻量 Nginx 容器部署：

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

部署形态：

| 项 | 建议 |
|---|---|
| 镜像 | 多阶段构建出的静态 Nginx 镜像 |
| 端口 | 内网 `80` 或部门约定端口 |
| 健康检查 | `GET /` 返回 200 |
| 日志 | Nginx access/error log |
| 数据 | 暂无服务端数据；用户草稿在各自浏览器 |
| 回滚 | 保留上一版镜像 tag，必要时切回 |

内网部署验收：

1. 内网机器访问首页正常。
2. 评分录入、刷新后草稿仍在。
3. Excel 模板下载与导入正常。
4. 图表 PNG 导出正常。
5. 构建产物不包含源码路径、token 和个人数据。
6. 无外网请求；浏览器 DevTools Network 只包含本站资源。

## 4. WorkBuddy 云端预览部署

除本机和内网部署外，当前纯前端构建产物也可以发布为 WorkBuddy 在线预览应用。

适用场景：

- 快速给 HJ / 相关同事看最新 UI 与交互
- 不依赖部门服务器时的临时演示
- 发布当前 `dist/` 生成产物

流程：

```powershell
cd D:\01_HJ_Work\00_Person\04_Project\08_Rtings-Calculate
npm run build
```

然后将 `dist/` 目录作为静态站点发布。注意：

- 发布的是生产构建产物，不是源码目录。
- 每次代码更新后，需要重新构建并重新发布，线上内容才会更新。
- 当前应用数据保存在浏览器 localStorage；不同设备不会自动同步草稿。
- 这类链接适合预览和演示，正式内网部署仍按第 3 节方案执行。

## 5. 后续接入 tvsms

项目管理系统源码：`D:\01_HJ_Work\00_Person\04_Project\05_tvsms`。

集成边界建议：

| 边界 | 方案 |
|---|---|
| 评分核心 | 保持独立包/模块，不复制公式到 tvsms 页面 |
| 数据模型 | tvsms 只保存产品档案、评测 ID、规则版本和输入快照 |
| 计算方式 | tvsms 调用评分核心 API，不在数据库中存最终公式结果 |
| 文件导出 | 统一由 Rtings Calculate 生成，不重复实现 Excel 逻辑 |
| 权限 | 使用 tvsms 的登录和权限；本工具自身暂不做账号 |
| 部署 | Web 静态端可独立部署，也可作为 tvsms 的功能模块入口 |

预留 API：

```text
POST   /api/evaluations            创建评测
GET    /api/evaluations/:id       读取评测与输入快照
POST   /api/evaluations/:id/score 使用指定规则版本计算
GET    /api/rules/:version        读取规则配置
GET    /api/rules/:version/trace  读取指定评测的计算追踪
```

以上为接口草案，实际字段在 tvsms 集成前确认。

## 6. 发布检查清单

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] 本地 `dist/` 预览验证总览、对比、测试项对比、录入、导入、追溯
- [ ] 空草稿时不出现刷屏警告
- [ ] Excel 模板下载与导入校验正常
- [ ] Excel/PNG 导出正常
- [ ] 断网后页面功能仍可用
- [ ] 构建产物中无源表路径、PAT、密钥和个人数据
- [ ] 文档、README 与当前功能一致
