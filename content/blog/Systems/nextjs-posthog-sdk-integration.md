---
title: "Next.js 网站接入 PostHog SDK —— 真正开始采集数据"
date: "2026-02-18"
tags: [posthog, nextjs, analytics]
draft: false
summary: "PostHog 部署好了，下一步是让网站真正把数据发过来。这篇文章记录在 Next.js App Router 中集成 posthog-js 的完整过程。"
authors: [default]
---

> 前两篇，一篇讲选型，一篇讲部署。到这里，PostHog 已经在 Mac mini 上安安静静跑了几天了，公网也能访问。但打开后台一看——空的。一个事件都没有。就像搭了一间录音棚，设备全到位了，却还没按下录音键。这一篇，我们来按下那个键。

## 一、SDK 选型：posthog-js 还是 @posthog/react？

PostHog 官方提供了两个前端 SDK：

| 包名 | 定位 | 适用场景 |
|------|------|----------|
| `posthog-js` | 核心 JS SDK | 任何 Web 应用 |
| `@posthog/react` | React 封装层 | 提供 `PostHogProvider` 和 Hooks |

看起来 `@posthog/react` 更"正式"——官方组件嘛，开箱即用。但研究了一下，我选了**直接用 `posthog-js`**。

原因很简单：`@posthog/react` 的 Provider 实现其实很薄，核心逻辑不过是初始化 + Context 注入。而在 Next.js App Router 中，我们需要更精细地控制初始化时机（比如只在客户端执行、处理路由变化、避免重复上报），官方封装反而不够灵活。

说白了，**自己写个 Provider，60 行代码就搞定了，还能完全掌控每个细节。**

安装：

```bash
npm install posthog-js
```

## 二、在 Next.js App Router 中集成

### 整体思路

Next.js 的 App Router 有一个关键特性：**所有组件默认是 Server Component**。而 PostHog 的 JS SDK 只能在浏览器里运行——它需要 `window` 对象来发送请求、存储 cookie。

所以集成的核心思路是：

1. 创建一个 `'use client'` 的 Provider 组件
2. 在 `layout.tsx` 中把它包在最外层
3. 利用 `useEffect` 确保只在浏览器端初始化

### 创建 PostHogProvider

先看完整代码，然后逐块拆解：

```tsx
// src/components/PostHogProvider.tsx
'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export function PostHogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const initializedRef = useRef(false);
  const lastTrackedUrlRef = useRef<string | null>(null);

  // 初始化 PostHog
  useEffect(() => {
    if (initializedRef.current || !POSTHOG_KEY || !POSTHOG_HOST) {
      return;
    }

    // HTTPS 混合内容防护
    if (window.location.protocol === 'https:' && POSTHOG_HOST.startsWith('http://')) {
      console.warn(
        '[PostHog] skipped initialization: HTTPS page cannot send events to HTTP host.'
      );
      return;
    }

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,     // 关掉自动 pageview
      capture_pageleave: true,     // 记录页面离开
      autocapture: true,           // 自动采集点击事件
      person_profiles: 'identified_only',  // 只为已识别用户创建 profile
      loaded: (instance) => {
        if (process.env.NODE_ENV === 'development') {
          instance.debug();        // 开发模式打开 debug
        }
      },
    });

    initializedRef.current = true;
  }, []);

  // 手动追踪 pageview
  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    const query = window.location.search.slice(1);
    const url = `${window.location.origin}${pathname}${query ? `?${query}` : ''}`;

    // 去重：同一个 URL 不重复上报
    if (lastTrackedUrlRef.current === url) {
      return;
    }

    posthog.capture('$pageview', {
      $current_url: url,
    });
    lastTrackedUrlRef.current = url;
  }, [pathname]);

  return <>{children}</>;
}
```

这个组件做了两件事：**初始化 SDK** 和 **手动追踪页面浏览**。下面展开讲。

### 在 layout.tsx 中包裹全局

```tsx
// src/app/layout.tsx
import { PostHogProvider } from "@/components/PostHogProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <PostHogProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

放在 `ThemeProvider` 内层，确保主题切换不会导致 PostHog 重新初始化。`PostHogProvider` 渲染的只是一个 Fragment（`<>{children}</>`），不会引入额外的 DOM 节点。

### 环境变量

在根目录的 `.env` 里配置两个变量：

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://ph.yourdomain.com
```

⚠️ **必须用 `NEXT_PUBLIC_` 前缀**。Next.js 的规则是：只有以 `NEXT_PUBLIC_` 开头的环境变量才会被打包到客户端代码里。不加前缀的话，`posthog.init()` 拿到的就是 `undefined`。

PostHog 的 API Key 可以在后台 `Project Settings → API Keys` 里找到。这个 Key 是公开的（会出现在前端代码里），不需要保密——PostHog 通过 `allowed_domains` 来控制谁可以向你的实例发送数据。

## 三、初始化配置详解

初始化代码看起来很短，但每个配置项都是有讲究的。

### `capture_pageview: false`

这是**最重要**的一项。

PostHog 默认会在 `init()` 执行时自动发一次 `$pageview` 事件。在传统的多页面网站里，这没问题——每次页面加载都会重新执行脚本。

但 Next.js 是 SPA 架构。用户在页面之间导航时，**不会重新加载页面**，而是通过客户端路由跳转。这意味着：

- 如果开着自动 pageview，**只有第一次加载会被记录**
- 后续的页面跳转？PostHog 不知道发生了

你可能会问：PostHog 不是支持 SPA 自动追踪吗？确实，`posthog-js` 内部可以通过监听 `history.pushState` / `popstate` 事件来捕获路由变化。但 Next.js App Router 用的是自己的 navigation 系统（基于 React Server Components），路由变化**并不总是以标准的 `history.pushState` 方式触发**，导致自动检测不可靠——有时漏掉，有时重复。

所以 **PostHog 官方的 Next.js 集成文档本身就推荐关掉自动 pageview，改用 `usePathname()` 手动追踪**。这不是造轮子，而是 Next.js 场景下的标准做法。后面会讲具体实现。

### `capture_pageleave: true`

当用户离开一个页面时（关闭标签页、导航到其他网站、或者浏览器后台），PostHog 会记录一个 `$pageleave` 事件。

这个事件配合 `$pageview` 的时间戳差值，就能算出**页面停留时间**。对内容型网站来说，这几乎是最核心的指标——它能告诉你读者到底有没有在认真看文章，还是打开就关了。

### `autocapture: true`

这是 PostHog 的一个杀手级特性：**自动采集所有用户交互**。

开启后，PostHog 会自动捕获：

- 所有按钮点击
- 所有链接点击
- 表单提交
- 输入框变化

每个事件都会带上元素的标签名（`tag_name`）、CSS 类（`$el_class`）、文本内容（`$el_text`）等属性。

好处是：**你不需要提前想好要追踪什么**。先全量采集，回头在 Dashboard 里用属性过滤，就能找到你关心的交互行为。比如：

- 哪个导航链接被点击最多？
- 博客底部的分享按钮有人用吗？
- 暗色模式切换按钮的使用频率？

当然，autocapture 也有局限——采集的事件缺少语义化命名，后面做精细分析时还是需要手动埋点。这个留到后续文章再讲。

### `person_profiles: 'identified_only'`

PostHog 有一个"用户画像"（Person Profile）的概念——为每个用户创建一个持久化的档案，跨会话追踪行为。

默认情况下，PostHog 会为每个匿名访客都创建 Person Profile。对于个人博客来说，99% 的访客都是匿名的，创建这些 Profile 既浪费存储，也没什么分析价值。

设成 `'identified_only'` 后，只有当你主动调用 `posthog.identify()` 的时候才会创建 Profile。对个人网站来说，这意味着**不会为任何人创建 Profile**（你也不会让读者登录），但事件数据照常采集，分析功能不受影响。

### 开发模式 debug

```ts
loaded: (instance) => {
  if (process.env.NODE_ENV === 'development') {
    instance.debug();
  }
},
```

`loaded` 回调在 SDK 初始化完成后调用。我在这里根据 `NODE_ENV` 决定是否开启 debug 模式。

开启后，PostHog 会在浏览器控制台打印出所有采集到的事件，包括事件名、属性、请求状态。开发时非常有用——你能实时看到每次交互会产生什么数据，而不用切到 PostHog 后台去翻。

⚠️ **记得只在 development 开启**。production 环境下打 debug 日志会暴露你的 PostHog 配置信息，虽然没什么安全风险（API Key 本来就是公开的），但日志太吵了。

## 四、手动 Pageview 追踪

前面说了，关掉自动 pageview 后，我们需要自己来追踪路由变化。

### 核心实现

```tsx
const pathname = usePathname();
const lastTrackedUrlRef = useRef<string | null>(null);

useEffect(() => {
  if (!initializedRef.current) {
    return;
  }

  const query = window.location.search.slice(1);
  const url = `${window.location.origin}${pathname}${query ? `?${query}` : ''}`;

  if (lastTrackedUrlRef.current === url) {
    return;
  }

  posthog.capture('$pageview', {
    $current_url: url,
  });
  lastTrackedUrlRef.current = url;
}, [pathname]);
```

三个关键点：

**1. 用 `usePathname()` 监听路由变化**

`usePathname()` 是 Next.js App Router 提供的 Hook，返回当前 URL 的 pathname 部分（比如 `/blog/my-post`）。每次客户端路由切换时，pathname 会变化，触发 `useEffect` 重新执行。

**2. 拼接完整 URL**

pathname 只是路径，不包含域名和 query string。但 PostHog 的 `$current_url` 属性需要完整 URL，这样在 Dashboard 里才能看到带参数的完整地址（比如 UTM 来源标记 `?utm_source=twitter`）。

所以我手动拼了一下：`origin + pathname + query`。

**3. 去重逻辑**

用一个 `useRef` 记录上一次追踪的 URL。如果和当前一样，就跳过。

为什么需要去重？因为 Next.js 的 App Router 在某些情况下会触发多次渲染（比如 Suspense 边界、并行路由），导致 `useEffect` 被重复调用。没有去重的话，一次页面导航可能会产生两三个 `$pageview` 事件，数据就不准了。

这个小细节容易被忽略，但对数据准确性影响很大。PostHog 里看到的 PV 虚高？先检查这里。

## 五、HTTPS 混合内容防护

代码里有一段看起来有点多余的检查：

```tsx
if (window.location.protocol === 'https:' && POSTHOG_HOST.startsWith('http://')) {
  console.warn(
    '[PostHog] skipped initialization: HTTPS page cannot send events to HTTP host.'
  );
  return;
}
```

这不是防御性编程的洁癖。这是在解决一个**真实的问题**。

上一篇提到过：如果你的网站用了 HTTPS（几乎所有现代网站都是），浏览器会**强制阻止**向 HTTP 地址发送的请求。这叫 **Mixed Content 限制**。

也就是说，如果 PostHog 的 Host 地址还没配上 HTTPS——比如你还在调试阶段，只开了 HTTP——SDK 会初始化成功，但所有事件上报请求都会被浏览器静默拦截。**不报错，数据也不来，你甚至不知道哪里出了问题。**

所以我在初始化之前加了这个检查：如果检测到 HTTPS 页面 + HTTP host 的组合，直接跳过初始化，并在控制台打一条 warning。

这个问题在第二篇搞好 HTTPS 之后就不存在了。但作为一个防护措施留着，万一哪天证书过期或者配置改错，至少能在控制台看到明确的提示，而不是在后台盯着空空的事件列表发呆。

## 六、验证数据采集

代码写完了，怎么确认数据真的发出来了？

### 开发环境验证

1. 启动 Next.js 开发服务器：`npm run dev`
2. 打开浏览器控制台（F12），切到 Console 标签
3. 如果 debug 模式生效，你会看到类似这样的日志：

```
[PostHog.js] Sending event: $pageview
[PostHog.js] Properties: {$current_url: "http://localhost:3000/blog/my-post", ...}
```

4. 点击页面上的按钮、链接，控制台里会显示对应的 autocapture 事件

### PostHog 后台验证

部署到生产环境后，打开你的 PostHog 后台（`https://ph.yourdomain.com`），进入 **Activity → Events**。

如果一切正常，你会看到事件流开始滚动：

- `$pageview`：页面浏览事件
- `$pageleave`：页面离开事件
- `$autocapture`：自动采集的点击事件

每个事件都可以展开看详细属性：来源 URL、浏览器类型、操作系统、屏幕分辨率……

看到第一个真实事件出现在后台的那一刻，说实话比 `up.sh` 跑通的时候还让人高兴。因为这才是这一整套系统的终点——数据，终于开始流动了。

![PostHog Events Activity](/images/blog/nextjs-posthog-sdk-integration/ph-activity.png)


## 写在最后

回过头看，整个接入过程其实并不复杂——一个 63 行的组件，两个环境变量，就把 PostHog 和 Next.js 连上了。

但写这个组件的过程，远没有代码本身看起来那么顺畅。关掉自动 pageview 是吃了重复上报的亏之后才意识到的；去重逻辑是在后台看到一次导航产生三个 pageview 之后加上的；HTTPS 检查是在部署后盯着空白的事件列表排查了半小时才想通的。

这大概就是工程的真实节奏。代码最终定型的样子总是干净利落的，但背后那些试探和弯路，才是真正让人理解"为什么这样写"的过程。

现在，数据已经开始流入 PostHog 了。下一篇，我们终于可以做这整件事情的本来目的——**看数据**。打开 Dashboard，搭建第一个 Insight，看看你的网站上到底发生了什么。

敬请期待 🚀
