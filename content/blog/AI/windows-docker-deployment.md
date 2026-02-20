---
title: "OpenClaw 到底怎么装？写给 Windows 用户的折腾指南"
date: "2026-02-20"
tags: [openclaw, docker]
draft: false
summary: "折腾了一整个周末，在 Windows 上把 OpenClaw 跑通了。分享从 Docker 源码构建到 Gateway 部署的完整踩坑过程。"
authors: [default]
---

> 这不是一份冷冰冰的官方文档翻译，而是一次伴随着几次报错和重试的真实记录。

## 意料之中的起步

折腾开源项目，跟在陌生城市找路很像。你以为顺着官方文档的指路牌走就行，但往往拐过一个街角，就会遇到只有你这个操作系统才会出现的"死胡同"。

周末的下午，我决定把火遍全网的 OpenClaw 安装到我的日常工作机上。我的环境很普通：一台装了 Docker Desktop (基于 WSL2 后端) 的 Windows 电脑。本以为这会是一个简单的 `docker pull` 的故事，没想到却变成了一次颇费周章的部署之旅。

为了彻底看清这个"黑盒"里装了什么，我放弃了直接拉取官方镜像的捷径，选择了从源码构建。不是在炫技，只是出于一个开发者的朴素好奇：既然它被吹捧为"中间层"，我得亲眼看着它一层层摞起来。

## 第一层：把源码变成镜像

打开 PowerShell，找一块干净的目录。

第一步，把代码拉下来：

```powershell
git clone git@github.com:zhangjian94cn/clawdbot.git
cd clawdbot
```

接下来是漫长的构建。输入这行命令，然后你可以去倒杯咖啡：

```powershell
# -t 给镜像打个标签，-f 指定 Dockerfile
docker build -t openclaw:local -f Dockerfile .
```

看着屏幕上滚动的层层日志——下载 Node 22 基础镜像、安装 pnpm 依赖、编译 TypeScript、打包 Vite 前端——你会对这个项目的体量有一个直观的体感。最终镜像大约 7GB，构建耗时可能在十到二十分钟，取决于你的网络和机器性能。

## 第二层：搭建它的家（Docker Compose）

如果说镜像是一块砖，那 `docker-compose.yml` 就是建筑图纸。

在 OpenClaw 的世界里，核心组件是配对出现的：一个负责在后台静静运转的通信枢纽（**Gateway**），和一个负责供你敲打命令、配置参数的交互式控制台（**CLI**）。

在某个目录下（比如我使用了自己的运维仓库 `SysOps-Toolkit/docker/clawdbot`），准备好三个文件：

### 环境变量 `.env`

这就像是钥匙串。里面藏着两把最重要的钥匙：

```bash
# Gateway 令牌（自己生成一个随机字符串）
OPENCLAW_GATEWAY_TOKEN=your-random-token-here

# 模型 API Key（至少填一个）
OPENAI_API_KEY=sk-your-key-here
# ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Gateway Token 可以用 PowerShell 快速生成：

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

### 编排文件 `docker-compose.yml`

重点关注几个地方：

```yml
services:
  openclaw-gateway:
    image: openclaw:local
    container_name: openclaw-gateway
    restart: unless-stopped
    environment:
      HOME: /home/node
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
      TZ: Asia/Shanghai
    volumes:
      - ./data/config:/home/node/.openclaw
      - ./data/workspace:/home/node/.openclaw/workspace
    ports:
      - "18789:18789"
      - "18790:18790"
    init: true
    command:
      [
        "node",
        "dist/index.js",
        "gateway",
        "--bind",
        "lan",
        "--port",
        "18789",
        "--allow-unconfigured",
      ]
```

留意两个地方：

1. **`--bind lan`** —— 不加这个，Gateway 只监听容器内部的 127.0.0.1，宿主机的浏览器根本连不上。
2. **数据卷**：`./data/config` 映射到 `/home/node/.openclaw`，这是 OpenClaw 存放配置和配对密钥的位置。丢了这个目录，所有配置都得重来。

### 别忘了 `.gitignore`

如果你和我一样把部署配置纳入版本管理，记得排除运行时数据：

```
data/
```

根目录的 `.gitignore` 通常已经覆盖了 `.env`，但最好双重检查。

## 第三层：给你的助手办入职（Onboarding）

现在可以先把 Gateway 启动起来：

```powershell
docker compose up -d openclaw-gateway
```

然后跑一遍新手引导，完成模型配置：

```powershell
docker compose run --rm openclaw-cli onboard
```

终端里会出现文本式的向导：选定你要连接的模型（Claude 还是 GPT？），设置工作区的路径，选择消息频道。每敲下一次回车，你就能感觉到 `./data/config` 目录下的配置文件渐渐丰满起来。

但别高兴得太早——这里埋着此次部署最深的一个坑。

## 第四层：那些没人告诉你的"设备配对"

打开浏览器，输入 `http://localhost:18789`，出现了干净的 Dashboard 面板。填入 Gateway Token，信心满满地点下 **Connect**。

然后，一条冰冷的红色消息劈面而来：

```
disconnected (1008): pairing required
```

这是我在整个部署过程中耗时最长的一道关。

### 问题出在哪？

OpenClaw 采用了 **双重认证机制**：

1. **Gateway Token** —— 类似密码，你在 `.env` 里设置的那个字符串。
2. **Device Pairing（设备配对）** —— 每个客户端（浏览器、CLI、手机节点）首次连接时，会生成一对密钥，必须经过 Gateway 的密码学配对才能建立信任。

问题在于：`docker compose run --rm openclaw-cli onboard` 只配对了 Docker **CLI 容器**这个设备，而你的 **浏览器** 是另一个全新的、未被信任的设备。正常的本地安装里，`openclaw gateway` 会自动打开浏览器完成首次配对，但在 Docker 环境下，容器无法触达你的本地浏览器——配对自然无从发生。

### 正确的解法

关键命令是 `docker compose exec`（在**运行中的** Gateway 容器内执行），而不是 `docker compose run`（会创建一个孤立的新容器）：

```powershell
# 1. 先在浏览器里填好 Token 并点击 Connect（触发配对请求）

# 2. 查看待审批设备列表
docker compose exec openclaw-gateway node dist/index.js devices list

# 3. 找到你的浏览器设备 Request ID，批准它
docker compose exec openclaw-gateway node dist/index.js devices approve <Request-ID>
```

批准完成的瞬间，浏览器里的红色错误消失，Dashboard 自动连接上 Gateway，状态从 **Offline** 变成 **Online**。

那个绿色的小点亮起来的时候，你会想，早知道有这一步，至少能省下两个小时。

> **备忘**：每次用新浏览器或清除了浏览器缓存后访问 Dashboard，都需要重新配对。这不是 bug，而是 OpenClaw 的安全设计。

## 亮起的屏幕

一切就绪后，用 `docker compose logs -f openclaw-gateway` 看一眼启动日志。如果一切顺利，它会静静地停在监听端口的那一行，宣告就绪。

在 Dashboard 里，你能看到：

- **Status：Online** —— 网关在线
- **Model** —— 当前使用的模型（比如 `openai/gpt-5.1-codex`）
- **Channels** —— 已配置的消息频道

点一下 Health 端点，看到那个 `200 OK`。就这几个字符，宣告着它已经活过来了。

## 走过的弯路

坦白说，发现设备配对这个机制之前，我浪费了不少时间在错误的方向上。

第一个本能反应是去改配置文件。我钻进容器里，手动编辑 `openclaw.json`，把 `bind` 从 `loopback` 改成 `lan`，把 `auth.token` 对齐到环境变量——改完重启，依然 `pairing required`。

然后我尝试了更激进的办法：直接把 `devices/pending.json` 里的设备请求挪到 `paired.json` 里，试图绕过审批流程。结果 Gateway 完全不认——它的配对是基于密码学验证的，不是简单的文件搬运。

最荒唐的一次，我甚至把 `auth.mode` 设成了 `none`，想着干脆关掉认证。Gateway 直接崩了，反复重启。

最后的最后，我发现正确的做法出奇简单——三条命令：打开浏览器触发配对请求，`devices list` 看一眼，`devices approve` 批准一下。

但真正让我绕了弯的，其实是 `exec` 和 `run` 的区别。一开始我用 `docker compose run --rm openclaw-cli devices list`，每次都报连接超时。`run` 会创建一个全新的、孤立的容器——它和正在运行的 Gateway 不在同一个进程空间里，自然连不上。换成 `docker compose exec`（在现有容器内执行），一切迎刃而解。

一字之差，两个小时。

## 常用命令速查

```powershell
# 查看日志
docker compose logs -f openclaw-gateway

# 重启
docker compose restart openclaw-gateway

# 更新（重新构建镜像后）
docker compose up -d openclaw-gateway

# 停止全部
docker compose down

# CLI 诊断
docker compose run --rm openclaw-cli doctor

# 设备管理（在运行中的容器内执行！）
docker compose exec openclaw-gateway node dist/index.js devices list
docker compose exec openclaw-gateway node dist/index.js devices approve <ID>
```

## 写在最后

折腾了一整个下午，终于把 OpenClaw 的网关稳稳当当地跑在了后台。

关上终端窗口的时候，窗外的天色已经有点暗了。其实回过头看，它的部署并没有多么玄奥的设计，无非是标准的 Node.js 工程配合容器化打包。但在每一次报错排查和配置调整里——尤其是那个花了两个小时才搞明白的设备配对机制——你对它作为"中间层"的角色轮廓，又清晰了一点。

在这个阶段，它还只是一个没有挂载耳目的"大脑"。在下一篇里，我们将赋予它开口说话的能力 —— 看看如何把它接入到全天候相伴的聊天软件，让 AI 真正进驻你的手机。
