import { formatDistanceToNow } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import type { FeedItem } from '@/lib/feed';
import type { Language } from '@/lib/i18n';

interface FeedCardProps {
  item: FeedItem;
  language: Language;
  sourceLabel: string;
  openLabel: string;
}

const formatPublishedTime = (pubDate: string | undefined, language: Language) => {
  if (!pubDate) {
    return undefined;
  }

  const publishedAt = new Date(pubDate);
  if (Number.isNaN(publishedAt.getTime())) {
    return undefined;
  }

  const absoluteTime = new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(publishedAt);

  const relativeTime = formatDistanceToNow(publishedAt, {
    addSuffix: true,
    locale: language === 'zh' ? zhCN : enUS,
  });

  return {
    absoluteTime,
    relativeTime,
  };
};

export default function FeedCard({ item, language, sourceLabel, openLabel }: FeedCardProps) {
  const publishedTime = formatPublishedTime(item.pubDate, language);

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-primary-400 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-500/80">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="rounded-full bg-primary-50 px-2.5 py-1 font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
          {sourceLabel}
        </span>
        {publishedTime && (
          <>
            <time dateTime={item.pubDate} title={publishedTime.absoluteTime}>
              {publishedTime.relativeTime}
            </time>
            <span>{publishedTime.absoluteTime}</span>
          </>
        )}
      </div>

      <h2 className="text-lg font-semibold leading-tight text-gray-900 dark:text-gray-100">
        <a href={item.link} target="_blank" rel="noreferrer" className="hover:text-primary-600 dark:hover:text-primary-400">
          {item.title}
        </a>
      </h2>

      {item.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{item.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {item.category.map((tag) => (
          <span
            key={`${item.id}-${tag}`}
            className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {openLabel}
        </a>
      </div>
    </article>
  );
}
