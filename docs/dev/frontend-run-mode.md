# 前端运行模式（dev / production）

## 架构链路

浏览器 → nginx `1.94.99.191:443` → frps（控制端口 `:7000`）→ 本机 frpc（`/media/ctyun/datadisk1/docker/frpc/frpc.toml`，镜像内版本 `0.70.1`）→ `127.0.0.1:3656` → Docker `dty-fis-frontend-1` 容器内 `:3000`（Next.js `16.2.6`）。

frpc 中对应段为 HTTP 代理：`name = "fis.st.datangyuan.cn"`，`localIP = "127.0.0.1"`，`localPort = 3656`，`customDomains = ["fis.st.datangyuan.cn"]`。本文件不改这份 toml。

## 故障根因

Dev 模式下，Next 默认只信任 `localhost` / `127.0.0.1`。浏览器从 `https://fis.st.datangyuan.cn` 打开页面时会带上该 Origin，chunk 与 HMR WebSocket 被 dev 服务器 **403**，正文是 `Unauthorized`。脚本加载失败后页面不水合，登录表单退化为浏览器原生提交。

`allowedDevOrigins` 放行 `fis.st.datangyuan.cn`（可用环境变量 `ALLOWED_DEV_ORIGINS` 追加，逗号分隔）。只在 `next dev` 生效，不影响 `next start`。

### WebSocket 升级探测（2026-10-24）

直连 frps 候选端口（绕过 TLS，`Host: fis.st.datangyuan.cn`）：

| 目标 | 结果 |
|---|---|
| `http://1.94.99.191/login`（:80） | **301**，`Server: nginx`，`Location: https://fis.st.datangyuan.cn/login`。正文是 nginx 默认跳转页（`<center>nginx</center>`），不是 frp 的 Tahoma “Not Found” |
| 同一地址的 Upgrade 请求 | 同样 **301** 到 `https://fis.st.datangyuan.cn/_next/webpack-hmr?id=probe`，没有 `101` |
| `:8080`、`:81` | 超时，0 字节（curl 28）。不是正在应答的 vhost 端口 |

因此本轮没有打到 frps 的 vhost HTTP 端口，不能把升级失败归到 frps。

对照：

- 上一轮 **dev** 仍在跑时：本机 `Origin: http://localhost:3656` 的 Upgrade 得到 **`101 Switching Protocols`**；公网 `https://fis.st.datangyuan.cn/_next/webpack-hmr` 的 Upgrade 得到 nginx 风格 **404**（`Content-Length: 489`，Tahoma “Not Found”，没有 `X-Powered-By: Next.js`）。那一次请求停在 nginx，没有进到 Next。
- 本轮容器已是 **production**：普通 GET `/_next/webpack-hmr` 在公网和 `127.0.0.1:3656` 都是 Next 自己的 404（`X-Powered-By: Next.js`，ETag 相同），说明普通 HTTP 已经透传到 Next。带 Upgrade 的请求在公网和本机都是超时、0 字节；生产进程本身没有 HMR，这次超时不能单独证明 nginx 丢掉了 Upgrade。

frp 的 `type = "http"` 可以转发 WebSocket。公网若要在 dev 下使用 HMR，nginx 反代到 frps 时需要透传升级头：

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_http_version 1.1;
```

## 已做改动

- `apps/frontend/next.config.mjs`：增加 `allowedDevOrigins`。
- `.devcontainer/docker-compose.yml`：frontend 用 `NEXT_MODE` 选择 dev 或 production，默认 production。
- `/media/ctyun/datadisk1/docker/frpc/frpc.toml`：保持现有 HTTP 代理，未改。

## 切换方法

当前默认是 production：`next build && next start -p 3000`。宿主机端口仍是 `3656 → 容器 3000`。

切到 dev：在 `.devcontainer/.env` 增加 `NEXT_MODE=dev`，然后只重建前端（不要动其他服务）：

```bash
docker compose --env-file .devcontainer/.env -f .devcontainer/docker-compose.yml up -d --force-recreate frontend
```

切回 production：删掉该行，或设成 `NEXT_MODE=production`，再执行同一条命令。

不经过 Dev Container、直接在宿主机跑：

- dev：`apps/frontend/start.sh`（`next dev`，端口 3656）
- production：`apps/frontend/start.prod.sh`（`next start`）

## 验证状态

生产模式已在 `dty-fis-frontend-1` 运行（`next start -p 3000`，发布为 `:3656`）。公网 `https://fis.st.datangyuan.cn/login` 返回 200。

登录 E2E（Playwright + 系统 Chrome，对公网，2026-10-24）通过：

- 截图：`docs/dev/e2e-verify/01-login.png`、`02-select-account-set.png`、`03-dashboard.png`
- 路径：`admin` / `123456` → `/select-account-set` → 杭州云鑫账套 → `/dashboard`
- 控制台 error/warning：无；pageerror：无；4xx/5xx 请求：无

Dev 放行验证（临时容器 `:3666` 跑 `next dev`，测完已删除；生产容器未重启）：

- chunk + `Origin: https://fis.st.datangyuan.cn`：**200**（修复前同一请求为 403 `Unauthorized`）
- chunk + `Origin: http://fis.st.datangyuan.cn`：**200**
- chunk + `Origin: http://localhost:3666`：**200**
- `/_next/webpack-hmr` 带 `Origin: https://fis.st.datangyuan.cn`：**101 Switching Protocols**，正文含 `turbopack-connected`。`Sec-WebSocket-Key: aaaa` 不是合法的 16 字节 Key，Next 返回 400；换成标准 Key 后即为 101。
