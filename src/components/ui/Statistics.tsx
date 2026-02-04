'use client';

import Script from 'next/script';

export function Statistics() {
  return (
    <div className="text-sm text-gray-500 dark:text-gray-400">
      {/* 不蒜子统计脚本 */}
      <Script
        src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"
        strategy="lazyOnload"
      />
      
      <div className="flex items-center justify-center gap-4">
        <span>
          访问量：
          <span id="busuanzi_container_site_pv">
            <span id="busuanzi_value_site_pv">-</span>次
          </span>
        </span>
        <span>
          访客数：
          <span id="busuanzi_container_site_uv">
            <span id="busuanzi_value_site_uv">-</span>人次
          </span>
        </span>
      </div>
    </div>
  );
}
