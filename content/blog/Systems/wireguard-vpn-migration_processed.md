---
title: "三条隧道合并成一条 VPN：我是如何用 WireGuard 重构家庭服务器网络的"
date: "2026-03-10"
tags: ["WireGuard", "VPN", "网络架构", "家庭服务器"]
draft: false
summary: "家庭服务器跑了三条隧道（frpc、SSH 代理、SSH 中继），维护成本越来越高。用 WireGuard 一条 VPN 全部替代，20 分钟搞定。"
authors: [default]
---

昨天写了篇文章，讲我的企微 AI 助手从发消息到收到回复要经过 6 层网络跳转。

发完之后我自己看了眼架构图，越看越觉得不对劲：

```
Mac Mini ──frpc 隧道──────► 腾讯云 :18790  (入站 webhook)
Mac Mini ──SSH -L 8888───► 腾讯云 :8888   (出站代理)
Mac Mini ◄──ssh-relay────  腾讯云 :52923  (远程 SSH)
```

**三条独立的隧道，各管各的，互不感知。**

frpc 有心跳重连但 SSH 没有，SSH 隧道断了不会自动恢复。开机脚本要分别启动三个服务，任何一个挂了都得单独排查。

这不是架构，这是补丁摞补丁。

## 理想方案：一条 VPN 替代一切

既然 Mac Mini 和腾讯云之间需要双向通信，最本质的解决方案就是让它们在同一个虚拟局域网里。

WireGuard 是目前最适合的选择：

| 特性 | WireGuard | frpc + SSH |
|------|-----------|-----------|
| 隧道数量 | 1 条 | 3 条 |
| 方向 | 双向（互通） | 单向（各搭各的） |
| 自动重连 | ✅ 内核级 | ⚠️ frpc 有 / SSH 没有 |
| 延迟 | ~20ms | 同级别 |
| 加密 | Curve25519 | SSH/frpc 各自加密 |
| 维护成本 | 极低 | 高（三套配置） |
| 代码量 | ~4000 行 | N/A |

WireGuard 最让我惊喜的是它的简洁——整个内核模块只有约 4000 行代码，这和 OpenVPN 的 10 万行形成了鲜明对比。**少即是多，代码量越少，攻击面越小，bug 越少。**

## 迁移实操

### Step 1：腾讯云装 WireGuard

```bash
sudo apt install -y wireguard

# 生成密钥对
wg genkey | tee server_private.key | wg pubkey > server_public.key
```

配置 `/etc/wireguard/wg0.conf`：

```ini
[Interface]
Address = 10.8.0.1/24
ListenPort = 51820
PrivateKey = <server-private-key>

[Peer]
PublicKey = <mac-mini-public-key>
AllowedIPs = 10.8.0.2/32
```

```bash
sudo systemctl enable --now wg-quick@wg0
```

三条命令，腾讯云搞定。

### Step 2：Mac Mini 装 WireGuard

```bash
brew install wireguard-tools
```

配置 `/opt/homebrew/etc/wireguard/wg0.conf`：

```ini
[Interface]
Address = 10.8.0.2/24
PrivateKey = <mac-mini-private-key>

[Peer]
PublicKey = <server-public-key>
Endpoint = 124.222.119.248:51820
AllowedIPs = 10.8.0.1/32
PersistentKeepalive = 25
```

`PersistentKeepalive = 25` 是关键——家庭宽带在 NAT 后面，25 秒一次 keepalive 确保 NAT 映射不过期。

```bash
sudo wg-quick up wg0
```

> macOS 上有个小坑：`wg-quick` 的 shebang 写的是 `#!/usr/bin/env bash`，但系统自带的 bash 是 3.x 版本，wg-quick 要求 4+。需要用 `brew install bash` 安装 bash 5，然后用 Homebrew 的 bash 来执行：`sudo bash /opt/homebrew/bin/wg-quick up wg0`

### Step 3：验证 VPN 互通

```bash
# Mac Mini → 腾讯云
ping 10.8.0.1
# PING 10.8.0.1: 64 bytes, time=19.630ms ✅

# 腾讯云 → Mac Mini
ping 10.8.0.2
# PING 10.8.0.2: 64 bytes, time=85.774ms ✅
```

双向通了。接下来是重头戏——**迁移服务**。

### Step 4：替换入站链路（砍掉 frpc）

之前 nginx 通过 frpc 隧道到达 Mac Mini：

```
nginx → 127.0.0.1:18790 (frpc) → tunnel → Mac Mini :18789
```

现在直接走 VPN：

```nginx
# 之前
proxy_pass http://127.0.0.1:18790;

# 之后
proxy_pass http://10.8.0.2:18789;
```

一行改动，frpc 可以退役了。

### Step 5：替换出站链路（砍掉 SSH 隧道）

之前出站代理需要 SSH 端口转发：

```bash
ssh -L 8888:127.0.0.1:8888 tencent-server  # 把 tinyproxy 映射到本地
```

现在 Mac Mini 可以直接通过 VPN 访问腾讯云的 tinyproxy：

```bash
# .env
HTTPS_PROXY=http://10.8.0.1:8888   # 直接用 VPN IP，不需要 SSH 隧道
```

tinyproxy 加个监听地址和访问白名单：

```
Listen 10.8.0.1
Allow 10.8.0.2
```

又一条隧道砍掉了。

### Step 6：更新开机脚本

旧脚本启动 5 个服务：网络等待 → SSH 代理隧道 → frpc → ssh-relay → OpenClaw

新脚本只需 3 个：网络等待 → WireGuard VPN → OpenClaw

```bash
# 旧的启动序列（5 步）
_wait_network        # 等待 frps 7000 端口
ssh -L 8888 ...      # SSH 代理隧道
frpc -c frpc.toml    # frpc 入站隧道
ssh-relay             # SSH 中继
openclaw start        # AI 引擎

# 新的启动序列（3 步）
_wait_network        # 等待 WireGuard 端口
wg-quick up wg0      # 一条 VPN 搞定入站+出站
openclaw start        # AI 引擎
```

> ssh-relay 保留着兜底用，但理论上远程 SSH 也可以走 VPN。

## 迁移前后：到底改了什么

先看架构图的变化：

```
【迁移前：3 条隧道，各管各的】

         ┌── frpc 隧道 ──────────────► 腾讯云 :18790   → nginx :80
Mac Mini ┤── SSH -L 8888 ────────────► 腾讯云 :8888    → tinyproxy
         └◄─ ssh-relay ──────────────  腾讯云 :52923   → 远程 SSH
         每条隧道独立建立、独立断开、独立维护

【迁移后：1 条 VPN，双向互通】

Mac Mini (10.8.0.2) ◄══ WireGuard ══► 腾讯云 (10.8.0.1)
                    一条隧道搞定所有通信
```

### 逐项对比

| 维度 | 迁移前（frpc + SSH） | 迁移后（WireGuard） |
|------|---------------------|-------------------|
| **隧道数量** | 3 条独立隧道 | 1 条 VPN |
| **网络跳转** | 入站 4 跳 + 出站 3 跳 = 7 跳 | 入站 2 跳 + 出站 2 跳 = 4 跳 |
| **开机启动步骤** | 5 步（网络等待→SSH代理→frpc→relay→OpenClaw） | 3 步（网络等待→WireGuard→OpenClaw） |
| **配置文件数** | 5 个（frpc.toml + .env + start.sh + ssh-relay 配置 + nginx） | 3 个（wg0.conf × 2 + nginx） |
| **自动重连** | ⚠️ frpc 有 / SSH 无 / ssh-relay 无 | ✅ 全部由 WireGuard 内核处理 |
| **加密方案** | frpc: token 认证 / SSH: 密钥对（两套标准） | Curve25519 椭圆曲线（一套标准） |
| **延迟** | ~20ms（frpc） / ~20ms（SSH） | ~20ms（WireGuard） |

### 故障场景对比

这是最能体现差异的地方：

| 故障 | 迁移前的表现 | 迁移后的表现 |
|------|------------|------------|
| 网络闪断 5 秒 | frpc 自动重连 ✅，SSH 隧道断开 ❌（需手动重建） | WireGuard 自动恢复 ✅ |
| 路由器重启 | frpc 重连 ✅，SSH 都断 ❌，出站代理失效 | WireGuard 25s keepalive 自动恢复 ✅ |
| 腾讯云重启 | frps 启动 ✅，tinyproxy 启动 ✅，但 SSH 隧道需要 Mac Mini 侧重建 | WireGuard systemd 自启 ✅，Mac Mini 侧自动重连 ✅ |
| 排查"消息不回复" | 要分别检查 frpc、SSH 隧道、gateway、tinyproxy 四个组件 | 只查 WireGuard + gateway 两个组件 |

### 整体优势总结

**一句话：用一个网络层的抽象，消除了三个应用层的 workaround。**

具体来说：

1. **故障面缩小了 3 倍**。之前三个隧道的可用性是乘法关系（A × B × C），任何一个断了整体就挂。现在只有一个隧道，故障点从 3 个减到 1 个。

2. **排障复杂度从 O(n) 降到 O(1)**。之前排查要逐个检查 frpc → SSH 隧道 → gateway → API 返回值。现在只需：`wg show wg0` 看隧道状态 → `curl` 测 webhook。

3. **完全双向互通**。之前 Mac Mini 要访问腾讯云上的服务（tinyproxy），需要额外搭 SSH 端口转发。现在直接 `curl http://10.8.0.1:8888`，就像在同一个局域网。

4. **安全性提升**。WireGuard 使用 Curve25519 密钥交换 + ChaCha20 加密，比 frpc 的 token 认证强得多。而且因为 tinyproxy 绑定在 VPN 内网地址，从公网完全不可访问。

## 为什么不用 Tailscale？

很多人会问：WireGuard 有个更好用的封装叫 Tailscale，为什么不用？

答案是：**在国内，Tailscale 很慢。**

Tailscale 的 NAT 穿透失败后，流量会走 DERP 中继服务器。它的 DERP 节点几乎都在海外，国内用户的流量要绕太平洋一圈才能回来。

而我自建 WireGuard 的两个端点（Mac Mini 和腾讯云）都在国内，延迟只有 20ms。

如果你在国外，Tailscale 是更好的选择——零配置、自动密钥管理、ACL 权限控制，比裸 WireGuard 好用太多。但在国内，自建才是正道。

## 我的判断

这次迁移让我认识到一个道理：**技术债务的特征是"每个单独的决定都合理，但整体看起来很混乱"。**

frpc 解决入站问题？合理。SSH 隧道解决出站问题？合理。ssh-relay 解决远程访问？合理。但三个合理的决定叠在一起，就变成了一个难以维护的系统。

WireGuard 的价值不在于它做了什么新东西，而在于它用一个抽象层（虚拟局域网）统一了三个独立的需求。

**好的架构不是加法，是减法。**

---

**最后：**

如果你也在家庭服务器上维护着一堆隧道和代理，试试 WireGuard。20 分钟的迁移投入，换来的是长期的维护简化。

完整的配置和脚本在我的 GitHub skill 仓库中，留言"WireGuard"获取链接。
