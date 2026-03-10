---
title: "一条企微消息的奇幻漂流：从发出到收到回复，背后要穿越多少层？"
date: "2026-03-10"
tags: ["企业微信", "私有部署", "网络架构", "AI助手"]
draft: false
summary: "用家庭 Mac Mini 搭建企微 AI 助手，一条消息要经过 6 层网络跳转才能完成收发。本文拆解完整链路架构，以及那些你绝对想不到的坑。"
authors: [default]
---

上周末，我在企微里给自己的 AI 助手发了句"你好"。

等了 30 秒，没回复。又发了一句，还是没回复。

打开 Mac Mini 的日志一看——gateway 说"主动发送完成"，言之凿凿地告诉我消息已经发出去了。

**但我就是没收到。**

这背后的故事，牵扯出了一条你可能从未见过的、极其曲折的消息链路。

## 先看完整架构：一条消息的 6 层跳转

我的 AI 助手跑在家里的 Mac Mini 上，没有公网 IP，用的是家庭宽带。要让企微的 webhook 能打到这台机器，需要这样一条链路：

**入站（企微 → AI）：**
```
企微服务器
  → 腾讯云 nginx (80 端口)
    → frpc 反代 (18790 端口)
      → FRP 隧道穿越公网
        → Mac Mini frpc client
          → OpenClaw Gateway (18789 端口)
```

**出站（AI → 企微）：**
```
OpenClaw Gateway
  → SSH 隧道 (本地 8888 端口)
    → 腾讯云 tinyproxy (8888 端口)
      → qyapi.weixin.qq.com
```

一条消息的完整生命周期：**6 次网络跳转，横跨 2 台机器，穿过 2 条隧道**。

任何一个环节断了，消息就丢了。

## 第一层坑：frpc 开机自杀

最先发现的问题很直接——Mac Mini 重启后，frpc 没在跑。

检查日志才发现：frpc 在开机时试图连接腾讯云的 frps 服务器，但那个时刻 Wi-Fi 还没连上。连接失败后，frpc 直接退出了。

这是因为 frpc 有个默认配置 `loginFailExit = true`——**登录失败就退出，不重试**。

对于开机自启的场景，这个默认值简直是灾难。Mac Mini 开机后，Wi-Fi 需要几秒钟才能就绪，frpc 在这个窗口期尝试连接，必然失败，然后就永远不会再起来了。

**修复很简单，但不够：**

```toml
loginFailExit = false              # 登录失败不退出，持续重试
transport.heartbeatInterval = 15   # 15s 心跳
transport.heartbeatTimeout = 60    # 60s 超时视为断开
```

我还在开机脚本里加了网络就绪探测——用 `nc -z` 持续探测 frps 的 7000 端口，最多等 90 秒，确认网络通了再启动 frpc。

> 这个坑的本质：**基础设施服务的默认配置，是为"手动启动"设计的，不是为"开机自启"设计的**。

## 第二层坑：API 说成功了，但其实没成功

修好 frpc 后，消息能到达 gateway 了。日志里也看到了回复：

```
[wecom-app] 主动发送完成: streamId=7b76cc8a..., 共 1 段
```

"主动发送完成"——听起来很靠谱对吧？

但我就是收不到回复。

直到我手动用 `curl` 调了一次企微的发送 API，才看到真相：

```json
{
  "errcode": 60020,
  "errmsg": "not allow to access from your ip, from ip: 112.4.46.152"
}
```

**IP 白名单限制。**

企微自建应用要求所有 API 调用的来源 IP 必须在白名单中。而 Mac Mini 的家庭宽带是动态 IP，每次路由器重启都可能变。

更坑的是——**gateway 的 wecom 插件根本没检查 API 返回的错误码**。它看到 HTTP 200 就报"发送完成"了，完全无视了 body 里的 `errcode: 60020`。

> 这就是为什么日志骗了我。

## 解法：出站代理

加白名单是治标——IP 随时会变。根治方案是让所有出站 API 调用都走腾讯云的固定 IP。

架构设计：

```
Mac Mini ──SSH 隧道──► 腾讯云 tinyproxy ──► qyapi.weixin.qq.com
   :8888                  :8888        出站 IP: 124.222.119.248
```

你可能会问：不是已经有 frpc 了吗，为什么出站代理要另开一条 SSH 隧道？

因为 **frpc 的隧道方向是"把内网端口暴露到公网"**——Mac Mini 的 18789 端口通过 frpc 暴露到腾讯云的 18790。但出站代理恰好是反方向：Mac Mini 要访问腾讯云上的 tinyproxy。frpc 要实现这种"反向访问"需要用 STCP visitor 配置，远比一行 `ssh -L` 复杂。

所以最终方案：**入站靠 frpc 隧道，出站靠 SSH 隧道**，各司其职。

腾讯云上装 tinyproxy（一个极轻量的 HTTP 正向代理，内存只占 4.5MB），绑定 `127.0.0.1`，通过 SSH 本地端口转发暴露给 Mac Mini：

```bash
ssh -f -N -L 8888:127.0.0.1:8888 tencent-server
```

Mac Mini 的 `.env` 加上：
```bash
HTTPS_PROXY=http://127.0.0.1:8888
HTTP_PROXY=http://127.0.0.1:8888
NO_PROXY=127.0.0.1,localhost
```

Node.js 22 刚好支持 `--use-env-proxy` 标志，加到 `NODE_OPTIONS` 里就行。

看起来很完美？

## 第三层坑：环境变量的幽灵

配完代理，重启 gateway，发消息——还是没回复。

tinyproxy 的日志里也没有新的连接记录。代理根本没被用到。

这时候我用 `ps eww` 查看 gateway 进程的环境变量：

```bash
ps eww $(cat ~/Library/Logs/openclaw/gateway.pid) | tr ' ' '\n' | grep PROXY
# 输出：空
```

**gateway 进程里根本没有 `HTTPS_PROXY`。**

原因在这里。启动脚本 `start.sh` 通过 `source .env` 加载配置：

```bash
source "$SCRIPT_DIR/.env"     # HTTPS_PROXY=http://... 被读入
nohup openclaw gateway ...    # 但子进程看不到！
```

bash 的 `source` 把变量读进了当前 shell，但**没有 `export`**。这些变量是"shell 局部变量"，不会传递给子进程。`openclaw gateway` 作为子进程，环境是干净的。

修复：
```bash
export HTTPS_PROXY="${HTTPS_PROXY:-}"
export HTTP_PROXY="${HTTP_PROXY:-}"
export NO_PROXY="${NO_PROXY:-}"
```

> 这是一个经典的 bash 陷阱。很多人以为 `source .env` 就等于把环境变量"设置好了"，但 `VAR=value` 和 `export VAR=value` 是两回事。前者只在当前 shell 可见，后者才会传递给所有子进程。

## 第四层坑：undici 的静默失败

以为搞定了？Node.js 的 `--use-env-proxy` 确实让全局 `fetch` 走了代理。但 wecom-app 插件有自己的代理逻辑：

```javascript
function getProxyDispatcher() {
  const proxyUrl = process.env.HTTPS_PROXY;
  if (proxyUrl) {
    try {
      const { ProxyAgent } = require("undici");
      _proxyAgent = new ProxyAgent(proxyUrl);
    } catch {
      // 静默吞掉错误
    }
  }
  return _proxyAgent;
}
```

`require("undici")` 在 Node.js 22 中会失败——undici 虽然是 Node.js 的内置 HTTP 引擎，但它被编译进了二进制文件内部，**不能通过外部 `require()` 访问**。

`catch {}` 把这个错误静默吞掉了，然后回退到直连。

修复：手动在插件目录安装 undici 包：
```bash
cd ~/.openclaw/extensions/wecom-app && npm install undici
```

## 最终验证

四层坑全填完后，从企微发一条消息：

```
21:15:22 [wecom-app] inbound msg parsed: msgtype=text     ← 消息到达
21:15:28 [wecom-app] 主动发送完成: 共 1 段                  ← 回复发出
```

tinyproxy 日志同步出现 `qyapi.weixin.qq.com:443` 的连接记录。

企微收到了回复。✅

## 我的判断

这次排障给我最大的感受是：**当你在家庭网络上跑生产级服务时，每一跳都是一个潜在的断裂点**。

传统的服务部署，入站和出站走同一个公网 IP，简单粗暴。但当你把 AI 助手部署在家里的 Mac Mini 上，入站靠 FRP 隧道，出站靠 SSH 代理，中间还有个 API proxy 转 LLM 请求——

**一条消息的完整链路涉及 6 次跳转、3 个独立服务、2 条隧道。**

这不是在"搭一个 bot"，这是在搭一个分布式系统。

## 工业界怎么做？

你可能会问：真正的生产环境会这么折腾吗？

当然不会。工业界的标准做法是：

**直接部署在云服务器上。**

服务跑在阿里云/腾讯云 ECS 上，有固定公网 IP，入站出站走同一个网络出口。不需要 frpc 隧道，不需要 SSH 代理，不需要操心 IP 白名单。一台 2 核 4G 的 ECS 年费几百块，所有问题不存在。

如果是更大规模的企业级部署，一般是：

| 方案 | 做法 | 适用场景 |
|------|------|---------|
| **云原生** | 容器化部署在 K8s + 固定出口网关 | 大厂标配 |
| **Serverless** | 云函数（如 SCF）+ API 网关 | 中小团队、按量付费 |
| **企业 VPN** | 站点间 VPN + 专线 | 跨机房、需要内网互通 |
| **SaaS** | 直接用企微官方的 AI 助手能力 | 不想自建 |

那为什么我要折腾家庭部署？

几个原因：
1. **GPU 资源**：Mac Mini M4 的 NPU 可以本地跑模型，不需要为推理付费
2. **隐私**：所有数据留在本地，不过第三方云
3. **折腾的乐趣**：作为技术人，搞清楚每一层网络到底发生了什么，本身就是目的

**我的结论是：家庭部署适合技术玩家的个人项目，但如果你要给团队用，直接上云服务器，别折腾。**

**最后：**

这套架构已经稳定跑了，开机自启全自动。如果你也想在家搭一个企微 AI 助手，欢迎留言交流具体配置。
