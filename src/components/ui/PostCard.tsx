import Link from 'next/link';
import { Blog } from 'contentlayer/generated';

interface PostCardProps {
  post: Blog;
}

export function PostCard({ post }: PostCardProps) {
  const { slug, date, title, summary, tags, readingTime } = post;

  return (
    <article className="group relative flex flex-col justify-between space-y-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-x-4 text-xs">
        <time dateTime={date} className="text-gray-500 dark:text-gray-400">
          {new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        {tags && tags.length > 0 && (
          <Link
            href={`/tags/${tags[0].toLowerCase()}`}
            className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {tags[0]}
          </Link>
        )}
      </div>
      <div className="group relative">
        <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400">
          <Link href={`/blog/${slug}`}>
            <span className="absolute inset-0" />
            {title}
          </Link>
        </h3>
        <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
          {summary}
        </p>
      </div>
      <div className="relative mt-auto flex items-center gap-x-4">
        <div className="text-sm leading-6">
           <span className="text-gray-600 dark:text-gray-400">
              {readingTime?.text}
           </span>
        </div>
      </div>
    </article>
  );
}
