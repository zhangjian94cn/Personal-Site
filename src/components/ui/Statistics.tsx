'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

// 旧域名的历史数据基准值 (截止到域名迁移时)
const HISTORICAL_PV = 4431; // TODO: 替换为你旧域名的实际访问量
const HISTORICAL_UV = 2633; // TODO: 替换为你旧域名的实际访客数

export function Statistics() {
  const [pvCount, setPvCount] = useState<number | null>(null);
  const [uvCount, setUvCount] = useState<number | null>(null);

  useEffect(() => {
    // 监听不蒜子加载完成后获取数据
    const checkBusuanzi = setInterval(() => {
      const pvEl = document.getElementById('busuanzi_value_site_pv');
      const uvEl = document.getElementById('busuanzi_value_site_uv');
      
      if (pvEl && uvEl && pvEl.innerText !== '-' && pvEl.innerText !== '') {
        const newPv = parseInt(pvEl.innerText, 10) || 0;
        const newUv = parseInt(uvEl.innerText, 10) || 0;
        setPvCount(HISTORICAL_PV + newPv);
        setUvCount(HISTORICAL_UV + newUv);
        clearInterval(checkBusuanzi);
      }
    }, 500);

    return () => clearInterval(checkBusuanzi);
  }, []);

  return (
    <div className="text-sm text-gray-500 dark:text-gray-400">
      {/* 不蒜子统计脚本 */}
      <Script
        src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"
        strategy="lazyOnload"
      />
      
      {/* 隐藏原始不蒜子元素 */}
      <span id="busuanzi_container_site_pv" style={{ display: 'none' }}>
        <span id="busuanzi_value_site_pv">-</span>
      </span>
      <span id="busuanzi_container_site_uv" style={{ display: 'none' }}>
        <span id="busuanzi_value_site_uv">-</span>
      </span>
      
      <div className="flex items-center justify-center gap-4">
        <span>
          访问量：{pvCount !== null ? `${pvCount.toLocaleString()}次` : '加载中...'}
        </span>
        <span>
          访客数：{uvCount !== null ? `${uvCount.toLocaleString()}人次` : '加载中...'}
        </span>
      </div>
    </div>
  );
}

