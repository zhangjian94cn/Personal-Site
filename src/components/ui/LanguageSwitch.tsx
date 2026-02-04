'use client';

import { useLanguage } from '@/components/LanguageProvider';

export function LanguageSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium text-sm text-gray-700 dark:text-gray-200"
      aria-label="Switch Language"
    >
      {lang === 'zh' ? 'EN' : '中'}
    </button>
  );
}
