---
title: "5 分钟，让 AI 龙虾住进你的飞书"
date: "2026-03-22"
tags: ["OpenClaw", "飞书", "AI Agent", "教程"]
draft: false
summary: "从安装 OpenClaw 到在飞书里收到龙虾的第一条回复，全程 3 条命令 + 1 个二维码，跟着做就行。"
authors: [default]
---


OpenClaw 装好了，然后呢？

大多数人的龙虾装完就躺在终端里吃灰。但如果把它接进飞书，事情就不一样了——你在飞书对话框里发一句话，它就能开始干活。读文档、查日历、写周报，不用再开终端、不用记命令。

整个过程，从装 OpenClaw 到在飞书里收到龙虾的第一条回复，实际操作不到 5 分钟。

今天把这个流程拆开讲一遍。3 条命令 + 1 个二维码，跟着做就行。

> 💡 文末还整理了一份「**安装避坑速查卡**」，一页纸包含环境要求 + 全部命令 + 常见报错处理，后台回复「**飞书龙虾**」即可获取。

## 第一步：安装 OpenClaw

在开始之前，确认一下你的环境：

| 要求 | 最低版本 |
|------|---------|
| Node.js | ≥ 22.x |
| 操作系统 | macOS / Linux / Windows (WSL2) |
| 内存 | ≥ 2GB |

> 不确定自己的 Node 版本？终端跑一下 `node --version`。如果低于 22，先升级（推荐用 [nvm](https://github.com/nvm-sh/nvm) 管理版本）。

一切就绪的话，一行命令搞定安装：

**macOS / Linux：**

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

**Windows（PowerShell）：**

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

安装完会自动进入配置向导。跟着提示走就行——主要是填一个 API Key。我用的是方舟 Coding Plan 套餐的 Key，如果你也用这个，可以参考[官方文档](https://www.volcengine.com/docs/82379/2183190?lang=zh)获取。

![OpenClaw 安装终端输出](https://pub-3897d31468484cc8b335151ee1798271.r2.dev/images/blog/openclaw-feishu-install-guide/feishu_installation_terminal_example_1774102661146.png)

装好之后，跑两个命令验证一下：

```bash
# 启动网关
openclaw onboard --install-daemon

# 确认网关在跑
openclaw gateway status
```

看到绿色的 `running` 就算成功了。

***

## 第二步：给飞书装上龙虾插件

OpenClaw 装好了，但它还住在你的终端里。要让它搬进飞书，需要安装飞书插件。

在终端执行：

```bash
openclaw feishu install
```

这时候会弹出两个选项：

1. **新建机器人**（推荐新手选这个）
2. **关联已有机器人**

选「新建机器人」后，终端会显示一个二维码——用飞书客户端扫一下，就会跳到「一键创建飞书机器人」的页面：

![创建 OpenClaw 飞书机器人](https://pub-3897d31468484cc8b335151ee1798271.r2.dev/images/blog/openclaw-feishu-install-guide/feishu_create_bot.png)

扫码、确认、创建，整个过程不到 30 秒。

创建完成后，点击「打开机器人」，你就会在飞书里看到一个新的聊天窗口。发一条消息试试——比如随便说句「你好」。

如果龙虾回复了，恭喜，它已经住进你的飞书了。

***

## 第三步：验证安装

为了确保一切正常，在飞书对话框里发一条指令：

```
/feishu start
```

如果返回了版本号信息，说明飞书插件安装成功，连接稳定。

到这里，全流程就跑通了。总结一下你做了什么：

| 步骤 | 做了什么 | 耗时 |
|------|---------|:---:|
| ① | 安装 OpenClaw + 配置 API Key | ~2 分钟 |
| ② | 安装飞书插件 + 扫码建机器人 | ~1 分钟 |
| ③ | 验证安装 | ~30 秒 |

3 条命令 + 1 个二维码，总共不到 5 分钟。

***

## 踩坑备忘

折腾了一圈下来，顺便记录几个容易踩的坑，帮你节省排查时间：

### 坑一：Node.js 版本不够

OpenClaw 要求 Node.js ≥ 22.x。很多人系统里装的还是 16 或 18 的旧版本。解决方法：

```bash
# 推荐用 nvm 管理 Node 版本
nvm install 22
nvm use 22
```

### 坑二：Windows 用户请用 PowerShell

Windows 上安装**必须用 PowerShell**，不能用 CMD。CMD 的语法和路径处理跟安装脚本不兼容，会直接报错。

### 坑三：国内网络问题

安装过程需要从 GitHub 下载一些依赖，国内网络可能会超时。解决方法：

- 开代理
- 或者多试几次（有时候只是偶发性波动）

### 坑四：API Key 配置

如果你用的是方舟 Coding Plan，注意 API Key 的格式和 endpoint 地址要填对。具体配置方式参考 [Coding Plan 接入 OpenClaw 官方文档](https://www.volcengine.com/docs/82379/2183190?lang=zh)。

***

## 下一步

龙虾住进飞书了，然后呢？

说白了，现在它只是「搬进来了」，但还没完全认识你——它不知道你的飞书文档在哪、不知道你的日历是什么、也没法帮你发消息。

**下一篇**，我会讲怎么让龙虾「认识你」：批量授权、学习新技能、诊断检查。装完插件 ≠ 能用，90% 的人其实卡在这一步。

> 📢 这是「**OpenClaw × 飞书实战**」系列的第 1 篇。整个系列会从安装、配置、单机器人，一直讲到多 Agent 协作和 AI 自动开会。关注不迷路。

***

跑起来了吗？截图发评论区看看 📸

安装过程中遇到什么问题也欢迎留言，我会在下一篇里集中回答。

***

🎁 给你准备了一份「**安装避坑速查卡**」，一页纸打印出来贴桌上，覆盖环境要求 + 全部命令 + 6 个常见报错解决方法：

![OpenClaw × 飞书 安装避坑速查卡（预览）](https://pub-3897d31468484cc8b335151ee1798271.r2.dev/images/blog/openclaw-feishu-install-guide/openclaw-feishu-cheatsheet-teaser.png)

后台回复「**飞书龙虾**」即可获取高清 PDF 版。
