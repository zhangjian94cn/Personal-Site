---
title: "我把个人博客图片搬到了 Cloudflare R2，流量费直接变成 0"
date: "2026-03-13"
tags: ["DevOps", "Self-Hosted"]
draft: false
summary: "从腾讯云 nginx 迁移到 Cloudflare R2 的完整复盘：26 个文件、11 个源文件的 URL 替换、wrangler 踩坑、DNS 迁移到自定义域名绑定，手把手带你实现静态资源零流量费托管。"
authors: [default]
---

> 文末有完整的迁移脚本包，后台回复「R2」免费获取。

一个月前，我的个人博客突然被朋友转发进了一个技术群，当天 PV 涨了 10 倍。

打开腾讯云后台一看——流量包余量已经掉了三分之一。

我的博客图片、下载文件全部托管在一台 3Mbps 带宽的腾讯云轻量服务器上。平时没什么感觉，但这次让我意识到一个问题：**如果哪天一篇文章真的火了，我可能一夜之间就把整月流量用完了。**

于是我决定做一次迁移实验：**把所有静态资源搬到 Cloudflare R2——出口流量费永久 0 元。**

## 背景：你的静态资源到底花了多少钱？

先算笔账。

我的腾讯云轻量服务器配置：

| 项目 | 配置 |
|------|------|
| 带宽 | 3 Mbps |
| 月流量包 | 200 GB |
| 超出流量 | 0.8 元/GB |
| 用途 | 博客图片 + 下载文件（nginx 直出） |

看起来 200 GB 似乎够用？来看实际消耗：

| 场景 | 单次消耗 | 1000 次 PV |
|------|----------|-----------|
| 一篇包含 5 张图的文章 | ~2 MB | ~2 GB |
| 下载一个 zip 资源包 | ~5 MB | ~5 GB |
| 全站首页加载 | ~0.5 MB | ~0.5 GB |

**日常个人博客没问题。但一旦某篇文章被转发到大群或上了推荐，一天几千 PV 就可能吃掉大半流量包。**

更可怕的是，3 Mbps 带宽意味着：同一时刻最多也就几个人能流畅加载图片。并发一多，所有人都在转圈。

## 为什么选 Cloudflare R2？

市面上的静态资源托管方案对比：

| 方案 | 存储费 | 流量费 | CDN | 适合场景 |
|------|--------|--------|-----|---------|
| 腾讯云服务器直出 | 占磁盘 | 按包/按量 | 无 | 访问量极低 |
| 腾讯云 COS + CDN | 0.1 元/GB | 0.2 元/GB | 有 | 企业用途 |
| GitHub + jsDelivr | 免费 | 免费 | 有 | 小文件、开源项目 |
| **Cloudflare R2** | **免费 10 GB** | **0 元** | **全球 CDN** | **个人站最优解** |

R2 的杀手级特性：**零出口费用（Egress）**。不管你的文件被下载多少次，都不收流量费。10 GB 免费存储，个人博客完全够用。

**我的 26 个文件总共才 36 MB。**

## 实操过程

### 第一步：扫描代码库，提取所有资源 URL

我的博客是 Next.js 静态站点，图片在 Markdown 中引用。第一步要搞清楚到底有多少资源散落在代码各处。

写了一个脚本自动提取：

```bash
# extract-assets.sh（核心逻辑）
grep -roh 'https://assets\.zhangjian94cn\.top/[^")*` ]*' \
  content/ src/ | sort -u
```

结果：**26 个唯一资源 URL，分布在 11 个源文件中。**

```
📦 Found 26 unique asset URLs:
 - images/blog/wecom-integration/  (9 张)
 - images/blog/config-tuning/      (3 张)
 - images/blog/doubao-openclaw/    (3 张)
 - downloads/baoyu-xhs-skills.zip  (1 个)
 - ...
```

然后用 `wget` 批量下载到本地 `tmp-assets/` 目录：

```bash
bash scripts/extract-assets.sh | grep 'wget' | bash
# 36MB，几分钟搞定
```

### 第二步：创建 R2 存储桶

登录 Cloudflare Dashboard，创建存储桶非常简单：

1. 进入 R2 页面 → **Create bucket**
2. 桶名填 `personal-site-assets`
3. 位置选 **Asia-Pacific (APAC)**
4. 存储类型选 **Standard**

![Cloudflare R2 创建存储桶：桶名 personal-site-assets，位置 Asia-Pacific](https://assets.zhangjian94cn.top/images/blog/r2-migration/r2-create-bucket.png)

创建后，在 Settings → **Public Development URL** 开启公共访问，得到一个 `r2.dev` 域名。

### 第三步：批量上传到 R2（踩坑）

安装 Cloudflare 的 CLI 工具 `wrangler`：

```bash
npm install -g wrangler
wrangler login  # 浏览器弹出 OAuth 授权
```

然后写了一个上传脚本，逐个文件上传并自动识别 Content-Type：

```bash
# upload-to-r2.sh（核心逻辑）
find "$ASSET_DIR" -type f | while read -r file; do
  rel_path="${file#$ASSET_DIR/}"
  wrangler r2 object put "personal-site-assets/$rel_path" \
    --file="$file" --content-type="$ct" --remote
done
```

⚠️ **踩坑提示**：wrangler 默认上传到**本地模拟环境**，不是远程 R2！

第一次跑脚本，看到输出里有这行：

```
Resource location: local
Use --remote if you want to access the remote instance.
```

文件全传到了本地的模拟 R2 里。**必须加 `--remote` 参数**才会传到真正的 Cloudflare R2。这个坑不留神的话，你会发现 Dashboard 里啥也没有。

加上 `--remote` 重新跑，26 个文件全部上传成功 ✅

### 第四步：DNS 迁移（关键一步）

这一步很多教程不会提到，但如果你之前已经有分享链接在外面流传，**这一步是必须的**。

**问题**：我之前的博客文章、小红书帖子里，分享的下载链接都是 `https://assets.zhangjian94cn.top/downloads/xxx.zip`。如果直接弃用旧服务器，这些链接就全部 404 了。

**解法**：把域名 DNS 从腾讯云（DNSPod）迁到 Cloudflare，然后在 R2 桶上绑定原来的自定义域名。**域名不变，背后的存储换成 R2。**

操作步骤：

1. **在 Cloudflare 添加域名** `zhangjian94cn.top` → 获取两个 Nameserver 地址
2. **在腾讯云 DNSPod 修改 DNS 服务器**：选择「使用非腾讯云 DNS」，填入 Cloudflare 的 Nameserver

![腾讯云 DNSPod 修改 DNS 服务器：选择非腾讯云 DNS，填入 Cloudflare Nameserver](https://assets.zhangjian94cn.top/images/blog/r2-migration/dns-migration.png)

3. **在 R2 桶设置中绑定自定义域名** `assets.zhangjian94cn.top`

初始状态是 **Initializing**（正在签发 SSL 证书），几分钟后变成 **Active** ✅

![R2 Custom Domains：assets.zhangjian94cn.top 状态 Active](https://assets.zhangjian94cn.top/images/blog/r2-migration/r2-custom-domain-active.png)

### 最终验证

```bash
$ curl -sI 'https://assets.zhangjian94cn.top/downloads/baoyu-xhs-skills.zip' | head -5

HTTP/2 200
content-type: application/zip
content-length: 75414
server: cloudflare     # ← 流量已经走 Cloudflare R2！
```

`server: cloudflare` —— 完美。所有旧链接原样可用，但背后已经是 R2 在服务了。

## 迁移前后对比

| | 迁移前（腾讯云 nginx） | 迁移后（Cloudflare R2） |
|---|---|---|
| 存储 | 占服务器磁盘 | R2 免费 10 GB（目前仅 36 MB） |
| 流量费 | 超出流量包 0.8 元/GB | **0 元** |
| CDN 加速 | 无 | Cloudflare 全球边缘节点 |
| 带宽限制 | 3 Mbps | 无限制 |
| 旧链接 | 依赖服务器存活 | 永不失效 |
| 年成本 | 服务器续费 ≥ 500 元/年 | **0 元** |

## 踩坑总结

| 踩坑 | 原因 | 解法 |
|------|------|------|
| wrangler 上传到本地 | 默认是 local 模式 | 加 `--remote` 参数 |
| R2 自定义域名报错 "zone id not valid" | 域名还没在 Cloudflare 激活 | 等 Cloudflare 验证 Nameserver 完成 |
| 自定义域名绑定后仍走旧服务器 | 本地 DNS 缓存 | `dig @1.1.1.1` 确认实际解析，等待缓存刷新 |
| r2.dev 域名有速率限制 | 公共开发域名不适合生产 | 绑定自定义域名解决 |

## 我的结论

**如果你的个人站还在用云服务器直出静态资源，赶紧迁移到 Cloudflare R2。**

总耗时约 **30 分钟**（不算 DNS 传播等待时间），换来的是：

- 💰 流量费永久归零
- 🚀 全球 CDN 加速
- 🔗 旧分享链接永不失效

**适合场景**：个人博客、独立项目官网、开源文档站——任何静态资源托管场景。

**不适合场景**：需要服务端处理的动态资源、需要中国大陆极速访问的场景（Cloudflare 在国内速度一般，但比直连小带宽服务器还是快）。

***

**文末彩蛋 🎁**

我把这次迁移中用到的两个脚本打包好了：

- `extract-assets.sh` — 自动扫描代码库，提取所有静态资源 URL
- `upload-to-r2.sh` — 一键批量上传到 R2（已踩好 `--remote` 的坑）

**后台回复「R2」，免费获取脚本包。**

***

💬 **你的个人站静态资源用的什么方案？遇到过流量费的坑吗？评论区聊聊~**

下一篇带大家看看如何用 PostHog 追踪你的个人站访问数据——自建方案，数据完全自己掌控。关注不迷路。
