---
title: "从部署到上线 —— Mac mini 自建 PostHog 全流程"
date: "2026-02-18"
tags: [posthog, docker, self-hosted]
draft: false
summary: "Mac mini 自建 PostHog 全流程：Docker 部署、资源优化、FRP 内网穿透、HTTPS 配置，以及一路踩过的坑和背后的根因分析。"
authors: [default]
---

> 上一篇聊了为什么选 PostHog。这一篇，直接动手——从 Docker 部署到公网可访问，一篇搞定。记录真实踩坑，所有命令可直接复制执行。

## 一、为什么是 Mac mini？

先回答一个被问最多的问题：为什么不买台云服务器？

答案很简单：**穷，但有旧设备。**

家里有一台 2020 款 Mac mini（M1, 16GB），平时主力机换了 MacBook，它就一直吃灰。PostHog 的完整技术栈（ClickHouse + PostgreSQL + Redis + Kafka + 一堆微服务）跑起来大概吃 7-8 GB 内存，刚好够用。

Mac mini 做家庭服务器有几个天然优势：

- **功耗极低**：M1 待机功率不到 7W，满载也就 30-40W，一个月电费几块钱
- **静音无风扇**：放在书房角落，完全感知不到它的存在
- **macOS 原生 Docker Desktop**：安装即用，不需要折腾 Linux
- **稳定性强**：连续运行几个月不重启都没问题

唯一的问题是：Mac mini 在家庭内网，没有公网 IP。这个问题后面用 FRP 解决。

## 二、Docker 部署三步走

PostHog 官方提供了 Hobby Deployment 方案，基于 Docker Compose。我在这个基础上做了一些适配，把整个流程封装成了三个脚本。

### Step 1：准备工作区

```bash
cd ~/Code/SysOps-Toolkit/docker/posthog
cp .env.example .env
# 编辑 .env，填入必要配置
```

`.env` 中有几个关键配置必须填：

```env
# 你打算用的域名
DOMAIN=ph.yourdomain.com

# 安全密钥（生成一次就行，别随便换）
POSTHOG_SECRET=replace-with-56-char-secret
ENCRYPTION_SALT_KEYS=replace-with-32-char-hex

# PostHog 内部 Caddy 代理绑定的端口
POSTHOG_PROXY_HTTP_PORT=18000
```

> ⚠️ `POSTHOG_SECRET` 和 `ENCRYPTION_SALT_KEYS` 只需要生成一次。可以用 `openssl rand -hex 28` 和 `openssl rand -hex 16` 分别生成。**一旦用了就不要换**，否则已有数据可能无法解密。

### Step 2：克隆仓库 + 生成 Compose 文件

`prepare-posthog.sh` 做了三件事：

1. 克隆 PostHog 官方仓库（用了 `--filter=blob:none` 加速克隆，不下载历史文件内容）
2. 从仓库里复制 `docker-compose.base.yml` 和 `docker-compose.hobby.yml`
3. 生成启动和健康检查辅助脚本

```bash
bash prepare-posthog.sh
```

执行完后目录结构大致是：

```
docker/posthog/
├── .env                        # 你的环境配置
├── docker-compose.base.yml     # PostHog 基础服务定义
├── docker-compose.yml          # Hobby 部署编排
├── docker-compose.override.yml # 本地资源优化（重点！）
├── posthog/                    # PostHog 源码仓库
├── compose/                    # 启动脚本（自动生成）
└── share/                      # 共享数据目录
```

### Step 3：启动 + 健康检查

```bash
bash up.sh
```

`up.sh` 的逻辑很清晰：

1. 检查 Docker 是否安装且运行
2. 调用 `prepare-posthog.sh` 确保工作区就绪
3. 执行 `docker compose up -d`
4. 轮询 `/_health` 端点，最多等 20 分钟

第一次启动需要拉取大量镜像（ClickHouse、PostgreSQL、Redis、Kafka 等），**建议挂代理**，否则可能等很久。

启动成功后验证：

```bash
curl http://127.0.0.1:18000/_health
# 返回 "ok" 就对了
```


## 三、资源优化：让 16GB 的 Mac mini 跑得动

PostHog 完整版本会启动十几个服务，内存直接拉满。对于个人博客的观测需求，很多服务其实用不到。

### 禁用非必要服务

在 `docker-compose.override.yml` 中，用 `deploy.replicas: 0` 禁用了 7 个服务：

| 禁用的服务 | 原因 |
|-----------|------|
| `temporal-ui` | Temporal 工作流管理界面，开发调试用 |
| `temporal-admin-tools` | Temporal 管理工具 |
| `livestream` | 实时事件流 UI |
| `cymbal` | 错误符号化服务 |
| `replay-capture` | Session Replay 独立采集 |
| `cyclotron-janitor` | 后台任务清理 |
| `property-defs-rs` | 属性定义索引器 |

> ⚠️ **千万别禁用 `capture` 和 `feature-flags`**！PostHog 的 Caddy 代理会把 `/e/`（事件上报）和 `/flags/`（特性标记）的请求路由到这两个服务。禁了就是 502。

### 内存限制

给关键服务设了硬性上限，防止某个服务吃掉所有内存：

| 服务 | 内存上限 | 实际占用 |
|------|---------|---------|
| ClickHouse | 2 GiB | ~1.5 GiB |
| Web | 1.5 GiB | ~1.5 GiB |
| Worker | 1.5 GiB | ~1.4 GiB |
| Elasticsearch | 512 MiB | ~500 MiB |

### Worker 调优

Worker 默认配置在低内存设备上容易 OOM 重启。在 `.env` 中降低并发：

```env
POSTHOG_WORKER_WEB_CONCURRENCY=1
POSTHOG_CELERY_MAX_TASKS_PER_CHILD=100
POSTHOG_CELERY_MAX_MEMORY_PER_CHILD=400000
```

优化后，整个技术栈稳定在 **7.5 GB 左右**，Mac mini 16 GB 绰绰有余。

![PostHog 服务拓扑：运行中 vs 已禁用](/images/blog/deploy-posthog-on-macmini/services-topology.png)

## 四、踩坑记录：那些文档里不会告诉你的事

自建 PostHog 最痛苦的不是部署本身，而是各种诡异的运行时问题。

在逐个记录之前，先说一个关键背景：**PostHog 的主要精力在 Cloud 版本上**。他们自己的 SaaS 跑在 Kubernetes 集群里，有专门的基础设施团队维护。而 Docker Compose 的 Hobby Deployment 本质上是一个**社区级的副产品**——能用，但优先级远低于 Cloud。

这意味着什么？很多代码是在 Cloud 环境下开发和测试的，默认假设你有 K8s 的服务发现、自动扩缩容、CI/CD 流水线。这些假设一到 Docker Compose 环境就会暴露出来。

理解了这个背景，下面的坑就不奇怪了。



### 坑 1：plugins 启动就崩——Redis 连接失败

**现象**：`plugins` 服务反复重启，日志里一直报 `ECONNREFUSED 127.0.0.1:6379`。

**根因**：Docker 里每个服务跑在自己的「小房间」（容器）里。`127.0.0.1` 只能找到自己房间里的东西，而 Redis 住在隔壁房间，门牌号叫 `redis7`（PostHog 官方 compose 文件里给 Redis 7.x 容器起的服务名）。

PostHog 的主服务（web、worker）都通过统一的环境变量配置 Redis 地址，没问题。但 `recording-api` 是后来加的模块，开发时直接写死了 `127.0.0.1`——在 Cloud 的 K8s 里有 sidecar proxy 处理服务发现，写死 localhost 是可以的。到了 Docker Compose 就废了。

**解法**：用环境变量覆盖硬编码的地址：

```env
SESSION_RECORDING_API_REDIS_HOST=redis7
SESSION_RECORDING_API_REDIS_PORT=6379
```

> 💡 从技术上讲，这些问题的"终极解法"是在 Mac mini 上跑 K8s（比如轻量级的 k3s），这样服务发现、有序部署、资源隔离都有了。但 K8s 本身要多吃 1-2 GB 内存，运维复杂度也高一个量级。**对单台机器跑几个服务的场景，Docker Compose 的性价比更高**

### 坑 2：plugins 崩——Region is missing

**现象**：日志报 `Region is missing`，看上去和 AWS 有关，但你根本没用 AWS。

**根因**：PostHog Cloud 用 AWS SES 发邮件（验证码、报告推送等）。代码里在初始化阶段就会加载 SES 客户端，**不管你用不用邮件功能都会执行**。Cloud 环境通过 IAM Role 和环境变量自动注入了 Region，代码不需要做空值检查。到了自建环境，这些 AWS 上下文不存在，代码没做优雅降级，直接崩了。

**解法**：随便给一个合法的 Region 值，让初始化通过就行：

```env
SES_REGION=us-east-1
```

### 坑 3：Elasticsearch OOM

**现象**：Elasticsearch 容器退出码 137（被系统的 OOM Killer 强杀了）。

**根因**：Elasticsearch 是出了名的内存大户——它默认会尝试申请尽可能多的内存用于 JVM 堆和文件系统缓存。PostHog Cloud 里 ES 跑在独立的高内存节点上，有充足的资源兜底。Docker Compose 的 compose 文件里**没给 ES 设任何内存限制**，它会和 ClickHouse、PostgreSQL 等十几个服务抢同一台机器的内存，很容易触发 OOM。

**解法**：在 override 里给一个硬上限（512 MB 对于个人博客的搜索需求绰绰有余）：

```yaml
# docker-compose.override.yml
elasticsearch:
  deploy:
    resources:
      limits:
        memory: 512M
```

### 坑 4：PostgreSQL 数据库字段缺失

**现象**：`plugins` 服务崩溃，日志报 `column posthog_person.last_seen_at does not exist`，所有事件进入 DLQ（Dead Letter Queue），不再被处理。

**根因**：这是**版本升级时的数据库迁移竞争**问题。PostHog 在 Docker Compose 里的迁移策略是：`web` 容器启动时自动执行 `migrate`。但当你拉了新版镜像后，`plugins` 可能比 `web` 先启动，这时候新代码引用的字段在旧数据库里还不存在——迁移还没跑呢。

Cloud 版本不会有这个问题，因为迁移是 CI/CD 流水线里的独立步骤，确保**先迁移完，再滚动更新服务**。Docker Compose 没有这种编排保证。

**解法**：手动补字段，然后重启：

```bash
docker exec posthog-db-1 psql -U posthog -d posthog -c \
  "ALTER TABLE posthog_person ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NULL;"

docker compose restart plugins
```

> 💡 升级 PostHog 版本时，建议先单独启动 `web` 让迁移跑完，再启动其他服务。

### 坑 5：Worker 持续低内存重启

**现象**：Worker 隔几个小时就静默重启一次，不报错但任务会丢。

**根因**：PostHog 的 Celery Worker 默认配置是为**专用服务器**设计的——高并发、不限单任务内存。Cloud 里 Worker 跑在独立的 K8s Pod 上，内存不够了 K8s 会自动扩容。Docker Compose 里所有服务共享一台机器的内存，Worker 按默认配置跑会持续膨胀，直到被 Docker 的内存限制杀掉。

**解法**：在 `.env` 中降低并发和单任务内存上限（上面资源优化部分已经提到）：

```env
POSTHOG_WORKER_WEB_CONCURRENCY=1
POSTHOG_CELERY_MAX_TASKS_PER_CHILD=100
POSTHOG_CELERY_MAX_MEMORY_PER_CHILD=400000
```


## 五、让公网访问内网的 PostHog

PostHog 部署好了，但它跑在 Mac mini 上，而 Mac mini 在家里的内网——你的网站（部署在 Vercel、Netlify 等平台上）没法直接把事件发到内网。

需要解决的核心问题：**把内网的 PostHog 暴露到公网**。

### 方案对比

| 方案 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **FRP** | 自建隧道 | 速度快、完全可控 | 需要一台公网服务器 |
| Cloudflare Tunnel | CF 边缘网络 | 免费、无需服务器 | WebSocket 不稳定、国内延迟高 |
| ngrok | 托管隧道 | 一键搞定 | 免费版不支持自定义域名 |

我选了 **FRP**，原因是手上已经有一台腾讯云轻量服务器，而且 FRP 的配置足够透明可控。

### FRP 架构

```
Mac mini (frpc 客户端)                腾讯云 (frps 服务端)
┌─────────────────────┐              ┌─────────────────────┐
│ PostHog :18000      │──── TCP ────→│ :12080              │
│ frpc                │   隧道      │ frps                │
└─────────────────────┘              └────────┬────────────┘
                                              │
                                     nginx 反代 + HTTPS
                                              │
                                    ph.yourdomain.com
```

### FRP 客户端配置

Mac mini 上的 `frpc.toml`：

```toml
serverAddr = "your-tencent-cloud-ip"
serverPort = 7000

auth.method = "token"
auth.token = "your-secret-token"

[[proxies]]
name = "posthog"
type = "tcp"
localIP = "127.0.0.1"
localPort = 18000        # PostHog 内部 Caddy 代理
remotePort = 12080       # 腾讯云上暴露的端口
```

关键点：`localPort = 18000` 对应 `.env` 中的 `POSTHOG_PROXY_HTTP_PORT`。FRP 会把腾讯云 `12080` 端口的流量转发到 Mac mini 的 `18000`。

### nginx 反向代理

腾讯云上的 nginx 配置：

```nginx
server {
    listen 80;
    server_name ph.yourdomain.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:12080;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持（PostHog 用）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超时设置要给够，PostHog 查询可能比较慢
        proxy_connect_timeout 30s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

几个容易踩的坑：

- **WebSocket 头必须加**：PostHog 的 Live Events 和 Session Replay 依赖 WebSocket，少了 `Upgrade` 和 `Connection` 头就连不上
- **`client_max_body_size`**：Session Replay 的录屏数据可能比较大，默认 1MB 不够用
- **超时要给够**：ClickHouse 复杂查询可能需要几十秒

![自建 PostHog 公网访问链路：浏览器 → 腾讯云 nginx/FRP → Mac mini](/images/blog/deploy-posthog-on-macmini/frp-nginx-architecture.png)

## 六、HTTPS：不是可选的，是必须的

你可能会想：反正是自己的工具，HTTP 能用不就行了？

不行。原因很简单：**混合内容限制（Mixed Content）**。

如果你的个人网站部署在 `https://yourdomain.com`，那浏览器**不允许**从 HTTPS 页面向 HTTP 地址发请求。也就是说，如果 PostHog 没有 HTTPS，JS SDK 的事件上报请求会被浏览器直接拦截。

### Let's Encrypt 自动证书

在腾讯云的 nginx 上配置 Certbot 自动签发和续期：

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 签发证书
sudo certbot --nginx -d ph.yourdomain.com

# 自动续期（certbot 会自动添加 cron）
sudo certbot renew --dry-run
```

Certbot 会自动修改 nginx 配置，把 HTTP 重定向到 HTTPS，并添加 SSL 证书路径。

## 七、一键部署：把全流程串起来

讲了这么多步骤，实际操作的时候不需要一步步来。我把整个流程封装成了一套脚本，核心就两条命令：

```bash
# 1. Mac mini 上：部署 PostHog
cd ~/Code/SysOps-Toolkit/docker/posthog
bash up.sh

# 2. 腾讯云上：部署 FRP + nginx + HTTPS
# （首次需要手动配，后续由 launchd/systemd 自动管理）
```

`up.sh` 内部会自动调用 `prepare-posthog.sh`，所以只需要提前把 `.env` 填好就行。

### 最终验证

打开浏览器，访问 `https://ph.yourdomain.com`。

如果你看到了 PostHog 的登录页面，🎉 恭喜，整个部署链路已经打通：

1. ✅ PostHog Docker 在 Mac mini 上正常运行
2. ✅ FRP 隧道将内网端口映射到云服务器
3. ✅ nginx 反向代理加上了 HTTPS
4. ✅ 浏览器可以正常访问

第一次访问会让你创建管理员账号和组织，按提示填就好。

## 写在最后

回顾一下这篇文章的核心流程：

```
配置 .env → prepare-posthog.sh → up.sh → FRP 隧道 → nginx 反代 → HTTPS → 上线
```

说实话，第一次搞的时候断断续续花了一整天，主要时间都花在了等镜像拉取和排查各种诡异的运行时 bug 上。但一旦跑通了，后续维护几乎是零成本——Mac mini 安安静静在角落跑着，偶尔 Docker Desktop 更新重启一下，PostHog 会自动恢复。

如果你也打算自建，我的建议是：

1. **先跑起来再优化**。不要一开始就想着配置完美，先 `up.sh` 跑通再说
2. **`.env` 一定要保存好**。密钥丢了或者换了，已有数据可能无法解密
3. **多看容器日志**。90% 的问题都能在 `docker compose logs` 里找到线索

下一篇，我们终于可以开始做**有趣的事情**了——在 Next.js 网站中接入 PostHog SDK，真正开始采集数据。

敬请期待 🚀
