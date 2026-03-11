---
title: "在微信里养一个 AI 同事，OpenClaw 企微全景推演"
date: "2026-03-08"
tags: ["OpenClaw", "企业微信", "Self-Hosted"]
draft: false
summary: "OpenClaw 住在 Docker，你住在微信。两界何以相通？看懂网络架构的底层中枢，打通企微接入与 FRP 穿透的唯一解。"
authors: [default]
---

> 前三篇，我们把 OpenClaw 从源码、Docker 到 API 代理的整条脉络全打通了。Gateway 终于能跑了——但只能在 Dashboard 的网页里干瞪眼。如果你只满足于此，那格局就太小了。这篇，我们要解决一个结构上的根本问题：**怎么在每日必用的手机微信里，让这个 AI 成为你名实相符的「贴身助理」？**

## 一、顺势而为：为什么是企业微信？

分析任何工具的选型，第一原则是看清大势。

OpenClaw 官方拥抱的主流是 WhatsApp 和 Telegram。但在国内，这两条通道的水土不服是结构性的，你总不能指望所有业务方都去装科学上网工具。真正能形成使用闭环的入口，有且仅有微信。

但个人微信的 API 历来是官方严打的雷区。市场上那些钻协议空子的逆向工具（如 itchat、WeChatFerry），天天在封号的边缘试探。这就叫**逆势而为**。把一个长期的底层基础设施，建在一片流沙之上，这种脆弱的架构撑不了大级别行情。

看清了这个前提，**企微自建应用，才是这一局的最优解：

- **免费创建，门槛极低。** 随便注册个企业，自建应用不要钱，没审核，消息没限制。
- **无缝接入，顺应人性。** 就在你日常重度使用的微信生态里，不需要生硬地拉起一个新 App。
- **官方接口，堂堂正正。** 走官方的回调和发送 API，这是正道，稳如泰山。
- **现成插件。** 社区有 `@openclaw-china/wecom-app` 插件，拿来即用。

说白了，如果你想在国内搞个正正经经、长期服役的 AI Agent，企微自建应用就是当前最具确定性的「主路」。

## 二、第一步：在企微后台搭建壳体

所有事物的构建都有级别和次序。先在企微端把容器和接口备好，再反哺到 OpenClaw 注入灵魂。

### 2.1 创建应用

登录[企业微信管理后台](https://work.weixin.qq.com/wework_admin/frame)，切入核心：**应用管理 → 自建 → 创建应用**。

起个顺口的名字（比如"AI 助手"），挑个过得去的图标，**务必把可见范围设定为你自己**（结构不闭环，神仙也收不到消息），点击创建。

![创建应用页面](/images/blog/wecom-integration/wecom-create-app.png)

寥寥几秒。创建完毕后，你会直达应用详情的腹地：

![应用详情页](/images/blog/wecom-integration/wecom-app-created.png)

### 2.2 收集四大命门

接下来这四组字符串，是打通两界的密令，缺一不可：

| 信息 | 坐标 | 意义 |
|------|--------|------|
| **CorpID** | 「我的企业」→ 页面最底端 | 企业的最高标识 |
| **AgentID** | 应用详情页 | 也是应用的唯一身份证 |
| **Secret** | 应用详情页 → 点「查看」 | 核心密钥，阅后即焚，务必妥善保存 |
| **Token + EncodingAESKey** | 「接收消息」→「设置 API 接收」→ 点「随机获取」 | 消息加密与验签的对冲工具 |

**AgentID 和 Secret**，在详情页首屏一览无余：

![应用凭证页面：AgentID 和 Secret](/images/blog/wecom-integration/wecom-app-credentials.png)

**CorpID** 藏在「我的企业」页面最深处：

![企业 ID 位置](/images/blog/wecom-integration/wecom-corp-id.png)

极其重要的一步：在「设置 API 接收」时，你会看到一个 **接收消息的 URL**——**此刻，绝不要填！** 这是很多新手的死穴。你在这里瞎填一个不通的地址，企微的回调校验会直接把你无情拒绝，连保存的资格都没有。等 OpenClaw 跑起来了，再来走这最后一步棋。

### 2.3 绊倒无数人的暗礁："企业可信 IP"

在详情页的最下方，蛰伏着一个毫不起眼的配置：**「企业可信 IP」**。

![企业可信 IP 配置](/images/blog/wecom-integration/wecom-ip-whitelist.png)

这就是企微的防卫机制：任何主动调用其 API 的请求，其来源 IP 必须在这个白名单内。如果你的 OpenClaw 试图主动把回复推送给你，**它的真实出口 IP 必须在此列名**。

漏掉它的症状非常典型：**吃进去吐不出来。** 你的消息发过去了，但死活收不到回复。后台日志静静地躺着一行 `errcode: 60020`。无数人在这里到处抓虫，却不知病根在最基础的通讯门禁上。

> ⚠️ **踩坑忠告**：这里的 IP，是 OpenClaw 容器真正触达广域网的**最终出口 IP**。家用的宽带、套了内网穿透或是代理的，往往表里不一。老老实实进容器敲一行 `docker exec <container> curl -s ifconfig.me`，看透它的底牌再填。

## 三、第二步：为壳体注入灵魂

企微的规矩定好了，视线切回 OpenClaw 的控制台中枢。

### 3.1 挂载插件

去 Gateway UI 的 Plugins 页面，精准搜索 `@openclaw-china/wecom-app` 并挂载。更彻底的做法是直击底层，改写 `openclaw.json`：

```json
{
  "plugins": {
    "installs": [
      "@openclaw-china/wecom-app"
    ]
  }
}
```

重启 Gateway 后，盯紧启动日志。只要闪过这行 `[wecom-app] plugin loaded`，插件的经脉就算通了。

### 3.2 配置通道

在 `openclaw.json` 的 `channels` 节点下，新增 `wecom-app`，把刚才拿到的四大密令悉数注入：

```json
{
  "channels": {
    "wecom-app": {
      "webhookPath": "/wecom-app",
      "corpId": "ww1234567890abcdef",
      "corpSecret": "你的应用Secret",
      "agentId": 1000002,
      "token": "随机生成的Token",
      "encodingAESKey": "随机生成的EncodingAESKey"
    }
  }
}
```

看清楚数据级别：`agentId` 是整型数字，不带引号；`corpSecret` 是应用的秘钥，别张冠李戴搞成企业的。

干脆利落地重启：

```bash
docker compose restart openclaw-gateway
```

检索日志确认注册状态：

```bash
docker compose logs -f openclaw-gateway | grep wecom
```

出现 `webhook registered at /wecom-app`，说明 Gateway 已经在指定口子列阵以待。

### 3.3 回马枪：合拢回调校验

既然 OpenClaw 已经竖起了 `/wecom-app` 的大旗，现在可以杀回企微后台的「接收消息」页面，把 URL 填上去了。

![接收消息配置页面](/images/blog/wecom-integration/wecom-callback-config.png)

看你身处什么网络格局：
**格局 A（手握公网 IP）**：`http://<公网IP>:18789/wecom-app`
**格局 B（内网穿透叠加反代）**：`http://<公网IP>/wecom-app`（Nginx 抹平了 80 端口的突兀）

填写的完整形态如下：

![回调 URL 配置详情](/images/blog/wecom-integration/wecom-callback-fields.png)

点击「保存」，企微立马会派出一个 GET 请求去叩门。门一开，验明正身，保存成功。

掏出手机，点开企业微信的对应应用，发条信息。

如果你能看到下面这样的连贯对答——**恭喜，框架成型，你的 AI 员工正式接管岗位。**

![实际对话效果](/images/blog/wecom-integration/openclaw-aibot.png)

当然，这有个大前提：你的 OpenClaw 必须站在公网上。如果你也像我一样，把服务深藏在家庭宽带的 NAT 内网重围中，那你还得学会怎么用工具把网打穿。

## 四、网络结构的顶层设计：打通 NAT 壁垒

### 4.1 核心矛盾

企微的消息回调，本质上是**主被动倒置**的推送机制：你发消息，是企微服务器主动找你配置的 URL 要响应。这就要求你的服务端这头，**必须公网可达，能在外头留下坐标**。

但家庭宽带的内网，就像是个没门牌号的黑洞。企微的请求根本找不到北。

### 4.2 架构选型：弱者祈求稳定，强者构建体系

穿透的套路，无非三种：

| 方案 | 体系特征 | 致命缺陷 |
|------|------|------|
| **FRP** | 专业的工业级穿透。架构清晰，自带端口排斥检测与断线重防。 | 需自购云服务器（VPS）部署中枢 |
| **SSH 反向隧道** | 单线搏杀的游击战法。一串指令即可拉起。 | 极其脆弱的保活机制。断线后端口僵死、暗箱挂起的几率极高。 |
| **Cloudflare Tunnel** | 借壳上市的白嫖局。依托海外超级节点。 | 链路绕过太平洋，高延迟，配置略重。 |

我选 **FRP**。我手上既有一台跑着 RSSHub 和 WeWe RSS 穿透体系的腾讯云 VPS（frps 服务端），自然顺理成章地复用这套基建。

> 之前我也图省事跑过 SSH 隧道。但实操层面，这就像用纸糊堤坝。网络稍微一哆嗦，SSH 断了，PowerShell 重连脚本虽然执行了，但远端端口被死掉的僵尸进程占着，你的新连接全是无效的空转。FRP 这种具备完备代理生命周期管理的架构，才是长治久安的底座。

### 4.3 FRP 连环局结构

看透网络的结构，比背几十行配置指令重要得多。

核心原理：Windows 端跑 frpc 客户端，主动去找 VPS 的 frps 挂号，把本地躲在角落的 `18789` 端口，强制映射成公网上能被所有人围观的端口。

这套**不对称双向信道**的拓扑结构是这样的：

![FRP 穿透与 OpenClaw 部署架构图](/images/blog/wecom-integration/architecture-frp-wecom.png)

一图抵千言。入站走腾讯云，出站走你家里的宽带。绝大部分人的坑，就栽在这里！Mac Mini 和 Windows 兵分两路，同归一个中枢 frps 管理。Windows 这一脉，专门透传 OpenClaw 和 SSH。

Windows 上的配置切口极小（`frpc.toml`）：

```toml
serverAddr = "124.222.119.248"
serverPort = 7000

auth.method = "token"
auth.token = "你的FRP密钥"

[[proxies]]
name = "openclaw-webhook"
type = "tcp"
localIP = "127.0.0.1"
localPort = 18789
remotePort = 18789
```

指令拉起：

```powershell
frpc.exe -c frpc.toml
```

盯住这行 `start proxy success`，隧道即刻贯通。

### 4.4 门面工程：VPS 上的 Nginx 反代

既然 FRP 把口子撕开了，但直接裸露 `18789` 端口依然不够优雅。真正的架构，所有外部 HTTP 流量都应由 Nginx 在 80/443 端口统一收口，再向内部分发：

```nginx
server {
    listen 80 default_server;
    server_name _;

    location /wecom-app {
        proxy_pass http://127.0.0.1:18789;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

至此，入站回路的层次严丝合缝：

```
企微服务器 → VPS:80 → Nginx → FRP 隧道 → Windows:18789 → OpenClaw Gateway
```

Nginx 管分流打磨，FRP 管暗度陈仓，Gateway 专心应对业务逻辑。各司其职，这就叫架构的边界清醒。

### 4.5 部署自动化套件

能跑脚本的，决不上手。我写了套 PowerShell 一键发板脚本 `deploy-frpc-win.ps1`，把下载、配置套写、注册服务、开机自启这些烂活一次性干完：

```powershell
# 一键起飞
.\deploy-frpc-win.ps1 -Install

# 验明正身
.\deploy-frpc-win.ps1 -Status
```

## 五、结构性拆解与降维打击

这东西真干起来，鲜有一键通关的主。遇到问题，别像无头苍蝇一样拿浏览器乱刷，按着架构层次去降维拆解。

### 5.1 光吃不吐（只收不发）

**表象**：你在企微说话了，Gateway 日志显示 `msgtype=text` 收到了，但企微那边如泥牛入海，没回音。
**拆解**：就是因为没搞清楚容器到底用了哪个 IP 冲向公网。
**处理**：去配企业可信 IP。记住，看上面的架构图，要加的是你 **家庭宽带的出口 IP**，不是你那个跑 FRP 的腾讯云 IP！ 纯粹是刻舟求剑。如果有梯子，还得看清楚是不是科学上网的 IP 串台了。

### 5.2 认证失败的幽灵

不要瞎猜，直接拿最底层的 `curl` 手工上阵劈砍：

```bash
curl -s "https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=你的token" \
  -d '{"touser":"你的企微userid","msgtype":"text","agentid":1000002,"text":{"content":"test"}}' \
  | python3 -m json.tool
```

看 `errcode`：
- `60020`：IP 没放行（见上条）。
- `40014`：你的 token 过期或者 Secret 抄错了。

### 5.3 `localhost` 陷阱

**表象**：隧道绿灯，Nginx 正常，但死活 502。
**拆解**：在 Windows 体系里，`localhost` 极大概率被解析成 IPv6 的 `::1`。而你的 Docker 容器可能只固执地监听在 IPv4 上。两边鸡同鸭讲。
**处理**：无论是在 `frpc` 配置还是各类端口映射里，彻底戒除 `localhost`，老老实实写明 `127.0.0.1`。

### 5.4 FRP 报错 `port unavailable`

**现象**：启动报目标端口不可用。
**拆解**：一般就是你上次自己留下的僵尸进程，或者同名 proxy 冲突。FRP 的管理非常严格，重名必挂。
**处理**：去 VPS 拿 `ss -tlnp | grep 18789`，查出进程杀掉；或者把 proxy 换个独一无二的名字。

## 六、结语：万变不离其宗

回顾一下。配置企微应用，是幼儿园体操，有手就行。真正的门槛，全在弄懂那一串复杂的网络折返跑。

看清这个图谱的骨架，才是重中之重：

```
手机企微 App
  ↓ 发消息
企微服务器
  ↓ POST 回调
VPS Nginx (:80)  << 门面接待
  ↓ proxy_pass
FRP 隧道 (frps → frpc)  << 暗道输送
  ↓ 转发
Windows Docker (:18789)
  ↓
OpenClaw Gateway  << 枢纽处理
  ↓ 调模型
API Proxy → 第三方代理 → 上游 AI 模型
  ↓ 返回结果
OpenClaw Gateway
  ↓ 调企微 API 发消息（出站直走本地主干线！）
企微服务器
  ↓
手机企微 App 收到回复
```

六层转达，结构严密，没有多余的环节。出错了怎么查？**不要用眼睛猜，用 `curl` 从底往上逐层敲**。

1. **容器底盘**：`curl localhost:18789/health` 确认服务存活。
2. **隧道干线**：看 frpc 有没有 `success`，并在 VPS 上 `curl 127.0.0.1:18789/health`。
3. **分发枢纽**：在 VPS 用 `curl localhost/wecom-app` 考验 Nginx。
4. **外部联调**：企微后台的验签保存，最后再排查 60020 这档子事。

把这套网络结构盘明白，你才能获得一种随心所欲驾驭基础设施的自由度。从此，AI 不再是躲在书房屏幕后的玩具，而是能跟着你跑遍天涯海角、随时响应的工作核心。

