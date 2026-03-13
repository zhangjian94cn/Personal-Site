'use client';

export default function WeChatPromo() {
    return (
        <section className="my-12 mx-auto max-w-2xl">
            {/* Divider */}
            <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                <span className="text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500 select-none">
                    关注公众号
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
            </div>

            {/* Card */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-col items-center gap-5 px-6 py-8 sm:px-10 sm:py-10">
                    {/* Description */}
                    <p className="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-w-md">
                        如果觉得文章有启发，欢迎微信搜索或扫码关注公众号{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">GeekZ</span>
                        。在这里我会持续分享 AI、系统架构与效率工具的深度干货与实战经验。
                    </p>

                    {/* Promo Image — Light mode */}
                    <div className="block dark:hidden w-full max-w-sm">
                        <img
                            src="https://assets.zhangjian94cn.top/images/blog-promo/wechat-promo-light.png"
                            alt="微信搜一搜 GeekZ 公众号"
                            width={800}
                            height={300}
                            className="rounded-xl"
                            loading="lazy"
                        />
                    </div>

                    {/* Promo Image — Dark mode */}
                    <div className="hidden dark:block w-full max-w-sm">
                        <img
                            src="https://assets.zhangjian94cn.top/images/blog-promo/wechat-promo-dark.png"
                            alt="微信搜一搜 GeekZ 公众号"
                            width={800}
                            height={300}
                            className="rounded-xl"
                            loading="lazy"
                        />
                    </div>
                </div>

                {/* Subtle corner glow */}
                <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/5" />
                <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/5" />
            </div>
        </section>
    );
}

