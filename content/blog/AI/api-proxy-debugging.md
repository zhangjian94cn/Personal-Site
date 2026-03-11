---
title: "接入第三方 API 代理——一场 User-Agent 引发的深夜排错"
date: "2026-02-21"
tags: ["OpenClaw", "DevOps"]
draft: false
summary: "OpenClaw 跑起来了，但第三方 API 死活不通。从 Cloudflare WAF 拦截到 Provider 归一化陷阱，三个坑，一个比一个深。"
authors: [default]
---

> Gateway 跑起来了，Dashboard 也亮了绿灯。但当我试着把手上现有的 API 接进去时，才发现——"能跑"和"能用"之间，隔着三个深坑。

## 一、一个 API 能不能喂两张嘴？

上一篇里，OpenClaw Gateway 已经稳稳当当地跑在 Docker 容器里了。但它还只是个空壳——配置了 OpenAI 的 API Key，却没有一个真正通顺的模型调用链路。

问题出在 API 来源上。

我手上有一个能用的 Codex API，但不是 OpenAI 官方的。它走的是国内第三方代理——通过一条 ccman + gmn 的链路转发请求。这套配置在宿主机上的 codex-cli 里已经跑了很久，模型调用一切正常。

现在的问题是：**能不能让 OpenClaw 也复用这条链路，而不是再单独搞一套 Key？**

听起来不难。改个 `baseUrl`，填上同一个 Key，应该就完事了。

事情当然没有这么简单。但我的心态很明确：**接受所有的弯路，都是有意思的旅程。** 与其怕踩坑，不如通过踩坑把 OpenClaw 的内部结构摸个透——Provider 怎么解析的、模型名怎么路由的、认证链路长什么样。

## 二、第一个坑：Cloudflare 的"隐形墙"

先做一个最基本的测试：从 Docker 容器里调用同一个 API 端点。

在宿主机上，用 codex-cli 调——正常，200 OK。

进到 Docker 容器里，用同样的 Key 和端点调——**403 Blocked。**

同一个 Key、同一个端点，唯一的变量是运行环境。那差异点到底在哪？

我一开始怀疑是网络问题。容器的 DNS 解析有没有走通？代理地址是不是被防火墙拦了？排查了一圈，都不是。

转机来自一个细节：403 的返回体不是 JSON，**是一整页 HTML**。

这个信号太明显了。JSON 格式的 403 通常是 API 层面的认证拒绝，但返回 HTML 页面——这是 **Cloudflare WAF 的拦截风格**。

顺着这个思路去看请求头，找到了嫌疑人：**`User-Agent`**。

Node.js 版的 OpenAI SDK 默认发送的 User-Agent 是 `OpenAI/JS 4.x.x`。在宿主机上用 codex-cli（Python SDK）调的时候，User-Agent 是另一个值。这两者走同一条代理链路，但在 Cloudflare WAF 那一层，表现完全不同。

验证方法很简单。手动用 `curl` 带上 `OpenAI/JS 4.x.x` 作为 UA 去请求 `/v1/models`——403。换成普通 UA——200。

```bash
# 带 OpenAI SDK 默认 UA → 被拦截
curl -H "Authorization: Bearer sk-xxx" \
     -H "User-Agent: OpenAI/JS 4.73.0" \
     https://your-proxy.example.com/v1/models
# → 403 (HTML 拦截页)

# 换一个普通 UA → 正常
curl -H "Authorization: Bearer sk-xxx" \
     -H "User-Agent: Mozilla/5.0" \
     https://your-proxy.example.com/v1/models
# → 200 (JSON 模型列表)
```

> ⚠️ **踩坑提示**：不是所有 403 都是 Key 的问题。拿到 403 后，先看返回体是 JSON 还是 HTML——如果是 HTML，大概率是网关层（Cloudflare / Nginx / CDN）在拦你，问题出在请求头而不是认证。

## 三、第一次方案：Nginx 反向代理（失败但有价值）

问题找到了，思路也清晰：在请求到达 Cloudflare 之前，把 User-Agent 改掉就行。

第一反应是在 Docker 内加一层 Nginx 反向代理，统一改写请求头。这是做过运维的人的本能——Nginx 处理 header 改写是基本操作。

写好配置文件，跑起来——**502 Bad Gateway。**

深入排查，问题出在上游是 HTTPS。Nginx 做反向代理转发 HTTPS 请求时，涉及 Host 头、SNI（Server Name Indication）和 TLS 握手的配合。在第三方代理的链路上，这些细节的排查成本比预想的高得多。

我在这个方案上花了大概一个小时，最后做了一个决定：**暂时放弃 Nginx，换一条更可控的验证路径。**

这不是说 Nginx 方案不可行。它完全可以跑通。但在"验证 User-Agent 是不是唯一问题"这个阶段，我需要一个更轻量、更快出结果的方案。验证完了再回来优化也不迟。

## 四、第二次方案：Node.js 极简代理

换个思路：既然 OpenClaw 自己就是 Node.js 写的，不如直接用 Node 写一个最小可控的代理。

逻辑很简单——收到请求，替换 User-Agent，用 `https.request` 转发，原样回传响应。不引入任何外部依赖，纯标准库。

整个代理脚本大约 30 行：

```javascript
// api-proxy.js — 极简 API 代理
const http = require("http");
const https = require("https");

const TARGET_HOST = "your-proxy.example.com";
const TARGET_PORT = 443;
const LISTEN_PORT = 3100;

const server = http.createServer((req, res) => {
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: TARGET_HOST,
      // 关键：替换 User-Agent，避免触发 WAF
      "user-agent": "Mozilla/5.0 (compatible; APIProxy/1.0)",
    },
  };

  const proxy = https.request(options, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
    // 直接 pipe，天然支持 SSE 流式传输
    upstreamRes.pipe(res, { end: true });
  });

  req.pipe(proxy, { end: true });

  proxy.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.writeHead(502);
    res.end("Bad Gateway");
  });
});

server.listen(LISTEN_PORT, () => {
  console.log(`API proxy listening on :${LISTEN_PORT}`);
});
```

把它作为一个独立的 Docker 服务加到 `docker-compose.yml` 里：

```yml
services:
  api-proxy:
    image: node:22-alpine
    container_name: api-proxy
    restart: unless-stopped
    volumes:
      - ./api-proxy.js:/app/api-proxy.js:ro
    working_dir: /app
    command: ["node", "api-proxy.js"]
    ports:
      - "3100:3100"
```

启动后验证：

```bash
curl http://localhost:3100/v1/models \
     -H "Authorization: Bearer sk-xxx"
# → 200 ✅ 模型列表正常返回
```

代理能稳定返回 200 了。User-Agent 的问题到此解决。

## 五、第二个坑：API 路径的"水土不服"

高兴得太早了。

代理通了，`/v1/models` 正常了，但真正的调用——`/v1/chat/completions`——又出问题了。

返回 **404 Not Found。**

这个 404 不是 Cloudflare 拦截，是上游代理服务器返回的正经 JSON 错误。意思很明确：路径找不到。

排查后发现：**第三方代理的路径规则和 OpenAI 官方不一致。**

OpenAI 官方 SDK 默认请求的路径是 `/v1/chat/completions`，但在 ccman/gmn 这条代理链路下，可用的路径是 `/chat/completions`——少了个 `/v1` 前缀。

那为什么在宿主机上用 codex-cli 能正常调用？答案藏在 `base_url` 的拼接逻辑里。OpenAI SDK（Python 和 JS 都一样）的 URL 构造方式是 `base_url + /chat/completions`。ccman 帮你配的 `base_url` 是 `https://gmn.xxx.com`（不带 `/v1` 后缀），SDK 拼出来的路径就是 `/chat/completions`——刚好是代理支持的。而 OpenClaw 这边如果在 `baseUrl` 里带上了 `/v1`，SDK 就会拼成 `/v1/chat/completions`，代理不认，直接 404。

同时还观测到另一个有趣的细节：`/v1/responses`（OpenAI 新版 Responses API）在这条链路上返回 502——至少在当时的环境和时段是不可用的。

解决方法有两条路：

1. **在 Node.js 代理里做路径改写**——把 `/v1/chat/completions` 自动改成 `/chat/completions`
2. **在 OpenClaw 配置里指定 `baseUrl` 时带上 `/v1`**——让 SDK 不再重复添加前缀

我选了第一条路，因为改写逻辑更集中，不依赖 OpenClaw 的配置细节。

> ⚠️ **踩坑提示**：第三方代理的路径规则可能与 OpenAI 官方不一致。别假设 `/v1/xxx` 一定可用，接入前务必先用 `curl` 逐个路径实测。

## 六、第三个坑（最深）：OpenClaw 的 Provider 归一化

代理通了，路径也对了。我满心以为终于可以顺利聊天了。

重启 Gateway，打开 Dashboard，发消息——

```
Error: No API key found for provider
```

怎么回事？Key 明明已经配了，代理也确认了 Key 有效。为什么 OpenClaw 还说找不到？

这个坑花了最长的时间。

### 从源码找线索

先在源码里搜这个错误信息。定位到了关键调用：

```javascript
listProfilesForProvider(store, "openai-codex");
```

等一下——**`openai-codex`？**

我配的模型名是 `openai/gpt-5.3-codex`。按直觉理解，它的 provider 应该是 `openai`，而我的 API Key 正是配在 `openai` 这个 provider 下面的。

但 OpenClaw 不这么认为。

### 归一化机制

翻了一遍 OpenClaw 的模型路由代码，发现了它的逻辑：

| 模型名                 | 你以为的 Provider | OpenClaw 归一化后的 Provider |
| ---------------------- | ----------------- | ---------------------------- |
| `openai/gpt-5.3`       | `openai`          | `openai` ✅                  |
| `openai/gpt-5.3-codex` | `openai`          | `openai-codex` ❌            |
| `openai/o4-mini`       | `openai`          | `openai` ✅                  |

看出规律了吗？OpenClaw 会把模型名中的 `-codex` 后缀识别为一个独立的 provider 子类，将 `openai/gpt-5.3-codex` 归一化为 `openai-codex/gpt-5.3-codex`。

这意味着当 OpenClaw 要查认证信息时，它不是在 `openai` 这个 provider 下面找 Key，而是在 `openai-codex` 下面找——当然找不到。

### 解决方案

需要在 `openclaw.json` 的 `models.providers` 中显式注册 `openai-codex` 这个 provider，让它指向同一个代理地址和 API Key：

```json
{
  "models": {
    "providers": {
      "openai-codex": {
        "baseUrl": "http://api-proxy:3100/v1",
        "apiKey": "sk-your-key-here",
        "name": "openai-codex"
      }
    }
  }
}
```

四项必须对齐：**provider 名称、baseUrl、apiKey、模型映射**——少了任何一项，OpenClaw 的认证链路就会断在归一化这一步。

改完配置，重启 Gateway，再试——**消息终于通了。**

## 七、完整架构图

折腾了这一整圈，我把整条请求链路画了出来。每一层解决一类问题：

![OpenClaw 四层 API 代理转发架构图](/images/blog/api-proxy-debugging/architecture-diagram.png)

四层转发，四类问题。看起来很绕，但每一层都有它存在的理由。去掉任何一层，链路就断了。

## 八、延伸：ccman 与 cc-switch 怎么选

顺带说一下我在折腾过程中用到的两个工具。如果你也在用第三方 API 代理，可能会遇到类似的选型问题。

| 工具          | 类型     | 适合场景                                             |
| ------------- | -------- | ---------------------------------------------------- |
| **ccman**     | CLI 工具 | 脚本化批量操作，适合在服务器上自动化管理多个代理配置 |
| **cc-switch** | 桌面 GUI | 可视化切换多个 provider，适合日常人工运维和调试      |

我的实际用法是：服务器端用 ccman 做自动化配置，本地调试时用 cc-switch 快速切换代理端点看效果。两者互补，不是替代关系。

## 写在最后

回过头看，三个坑各有各的教训，但归结起来就是三条可复用的结论：

**第一，`User-Agent` 不是可忽略的字段。** 在 CDN / WAF / 反向代理越来越普遍的今天，一个"不起眼"的请求头可能直接决定你的请求是被放行还是被拦截。拿到 403 时，别急着怀疑 Key，先看返回体类型。

**第二，模型名不只是展示字段。** 在 OpenClaw 的内部，模型名会影响 provider 归一化，进而影响认证链路的匹配。`openai/gpt-5.3` 和 `openai/gpt-5.3-codex` 看起来只差几个字符，但走的是完全不同的认证路径。

**第三，有争议的时候，源码通常比文档更接近真实行为。** 文档告诉你"配置 API Key 即可"，但没告诉你 provider 归一化会把你的 Key 路由到一个你没配过的地方。这种细节，只有源码不会骗你。

说白了，折腾了一圈下来，远比想象的复杂。但也正是因为这三个坑，我对 OpenClaw 的内部架构——模型路由、provider 解析、认证链路——有了远比文档更深的理解。

## 附录 A：可复现的最小测试清单（含 Codex 模型验证）

下面这组命令是我实际排错时反复使用的“最小闭环”，建议按顺序跑。

### A.1 先验证 Codex 模型本身可用（排除 Key/模型权限问题）

```bash
codex --version
codex exec -m gpt-5.3-codex "只输出OK" --json
```

预期：返回 `agent_message` 为 `OK`，命令退出码为 `0`。

### A.2 再做端点能力探针（区分 200/404/502）

```bash
BASE_URL="https://gmn.chuangzuoli.com"
KEY="sk-xxx"

# 1) 模型列表
curl -i "$BASE_URL/v1/models" \
  -H "Authorization: Bearer $KEY"

# 2) Chat Completions（按第三方代理实际路径实测）
curl -i "$BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5.3-codex","messages":[{"role":"user","content":"hi"}]}'

# 3) Responses API
curl -i "$BASE_URL/v1/responses" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5.3-codex","input":"hi"}'
```

我当时的观测快照：`/v1/models` 为 `200`，`/v1/chat/completions` 为 `404`，`/v1/responses` 为 `502`（会随代理策略变化）。

### A.3 最后验证 OpenClaw 端到端链路

```bash
cd docker/clawdbot
docker compose restart openclaw-gateway
docker compose exec openclaw-gateway node dist/index.js models
docker compose exec openclaw-gateway node dist/index.js config get agents.defaults
docker compose exec openclaw-gateway node dist/index.js agent --session-id <your-session-id> -m "Reply OK only"
```

预期：默认模型解析到 `openai-codex/gpt-5.3-codex`，并返回 `OK`。

## 附录 B：带路径改写的 `api-proxy.js`（可选增强版）

如果你的第三方代理“只认 `/chat/completions`，不认 `/v1/chat/completions`”，可以在代理层做最小路径改写。

```javascript
const http = require("http");
const https = require("https");
const { URL } = require("url");

const TARGET = process.env.TARGET || "https://gmn.chuangzuoli.com";
const PORT = Number(process.env.PORT || 3100);
const SAFE_UA = process.env.SAFE_UA || "Mozilla/5.0 (compatible; APIProxy/1.0)";
const ENABLE_REWRITE = process.env.ENABLE_REWRITE !== "0";

function rewritePath(pathnameWithQuery) {
  if (!ENABLE_REWRITE) return pathnameWithQuery;
  // /v1/chat/completions -> /chat/completions
  return pathnameWithQuery.replace(
    /^\/v1\/chat\/completions(\?|$)/,
    "/chat/completions$1",
  );
}

const server = http.createServer((req, res) => {
  const raw = req.url || "/";
  const targetUrl = new URL(raw, TARGET);
  const rewritten = rewritePath(targetUrl.pathname + targetUrl.search);

  const options = {
    hostname: targetUrl.hostname,
    port: 443,
    path: rewritten,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetUrl.hostname,
      "user-agent": SAFE_UA,
    },
  };

  delete options.headers.connection;
  delete options.headers["transfer-encoding"];

  const proxy = https.request(options, (upstream) => {
    res.writeHead(upstream.statusCode || 502, upstream.headers);
    upstream.pipe(res, { end: true });
  });

  req.pipe(proxy, { end: true });

  proxy.on("error", (err) => {
    console.error("[proxy error]", err.message);
    res.writeHead(502);
    res.end("Bad Gateway");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`api-proxy listening on :${PORT} -> ${TARGET}`);
});
```

> 实战建议：先把 `ENABLE_REWRITE=1` 跑通，再根据代理端真实路径规则决定是否关闭。

下一篇，我们会给这个终于能"开口说话"的 Gateway 接上它最重要的通道——手机聊天软件。让 AI 真正住进你的手机。
