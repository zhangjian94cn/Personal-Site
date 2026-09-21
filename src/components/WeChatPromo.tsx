"use client";

import { useLanguage } from "@/components/LanguageProvider";

const ACCOUNT_NAME = "GeekZ的知行录";
const LIGHT_SRC =
  "https://assets.zhangjian94cn.top/images/blog-promo/wechat-promo-light.png";
const DARK_SRC =
  "https://assets.zhangjian94cn.top/images/blog-promo/wechat-promo-dark.png";

type WeChatPromoProps = {
  /** post: blog footer card; section: about-page block matching section rhythm */
  variant?: "post" | "section";
};

export default function WeChatPromo({ variant = "post" }: WeChatPromoProps) {
  const { lang } = useLanguage();
  const isZh = lang === "zh";

  const title = isZh ? "公众号" : "WeChat Official Account";
  const description =
    variant === "section"
      ? isZh
        ? "欢迎微信搜一搜或扫码关注「GeekZ的知行录」。我会在这里持续分享 AI、系统架构与效率工具的深度干货与实战经验。"
        : "Search WeChat for GeekZ的知行录, or scan the QR code to follow. I share hands-on notes on AI, systems architecture, and productivity tools."
      : isZh
        ? "如果觉得文章有启发，欢迎微信搜索或扫码关注公众号 GeekZ的知行录。我会持续分享 AI、系统架构与效率工具的深度干货与实战经验。"
        : "If this article was useful, search WeChat for GeekZ的知行录 or scan the QR code to follow for more on AI, systems, and tools.";

  const alt = isZh
    ? `微信搜一搜 ${ACCOUNT_NAME}`
    : `Search WeChat for ${ACCOUNT_NAME}`;

  const banner = (
    <>
      <div className="block dark:hidden w-full max-w-md mx-auto">
        <img
          src={LIGHT_SRC}
          alt={alt}
          width={1954}
          height={624}
          className="w-full rounded-xl"
          loading="lazy"
        />
      </div>
      <div className="hidden dark:block w-full max-w-md mx-auto">
        <img
          src={DARK_SRC}
          alt={alt}
          width={1954}
          height={624}
          className="w-full rounded-xl"
          loading="lazy"
        />
      </div>
    </>
  );

  if (variant === "section") {
    return (
      <div className="py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-12 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <WeChatIcon className="w-5 h-5" />
          </span>
          {title}
        </h2>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12 px-6 py-8 sm:px-10 sm:py-10">
            <div className="lg:w-[42%] space-y-4">
              <p className="text-sm font-semibold tracking-wide text-emerald-600 dark:text-emerald-400">
                {isZh ? "微信搜一搜" : "Search on WeChat"}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {ACCOUNT_NAME}
              </p>
              <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
                {description}
              </p>
            </div>
            <div className="lg:flex-1 min-w-0">{banner}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="my-12 mx-auto max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
        <span className="text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500 select-none">
          {isZh ? "关注公众号" : "Follow on WeChat"}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-col items-center gap-5 px-6 py-8 sm:px-10 sm:py-10">
          <p className="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-w-md">
            {description}
          </p>
          <div className="w-full max-w-sm">{banner}</div>
        </div>

        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/5" />
      </div>
    </section>
  );
}

function WeChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .137-.032l1.995-1.105a.86.86 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.806 5.853-1.736-.576-3.583-4.196-6.331-8.658-6.331zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18z" />
      <path d="M17.309 11.188c-4.023 0-7.309 2.745-7.309 6.13 0 2.128 1.358 3.98 3.454 5.16a.48.48 0 0 1 .177.55l-.287 1.085a.28.28 0 0 0-.04.16c0 .136.108.246.242.246a.27.27 0 0 0 .114-.027l1.575-.867a.72.72 0 0 1 .598-.082c.78.215 1.614.334 2.476.334 4.023 0 7.309-2.745 7.309-6.13s-3.286-6.129-7.309-6.129zm-2.504 4.027c.45 0 .815.37.815.827a.822.822 0 0 1-.815.828.822.822 0 0 1-.815-.828c0-.457.365-.827.815-.827zm5.008 0c.45 0 .815.37.815.827a.822.822 0 0 1-.815.828.822.822 0 0 1-.815-.828c0-.457.365-.827.815-.827z" />
    </svg>
  );
}
