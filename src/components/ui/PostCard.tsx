import Link from 'next/link';
import { Blog } from 'contentlayer/generated';

interface PostCardProps {
  post: Blog;
}

export function PostCard({ post }: PostCardProps) {
  const { slug, date, title, summary, tags, readingTime } = post;

  return (
    <article className="group relative flex flex-col justify-between space-y-4 rounded-3xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 dark:bg-gray-800/50 dark:shadow-none dark:hover:bg-gray-800">
      <div className="flex items-center gap-x-3 text-xs font-medium text-gray-500 dark:text-gray-400">
        <time dateTime={date}>
          {new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <span>•</span>
        <span>{readingTime?.text}</span>
        {tags && tags.length > 0 && (
          <>
            <div className="flex-1" />
            <Link
              href={`/tags/${tags[0].toLowerCase()}`}
              className="relative z-10 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              #{tags[0]}
            </Link>
          </>
        )}
      </div>
      
      <div className="group relative">
        <h3 className="text-xl font-bold leading-tight text-gray-900 group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400 transition-colors">
          <Link href={`/blog/${slug}`}>
            <span className="absolute inset-0" />
            {title}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {summary}
        </p>
      </div>
      
      <div className="mt-auto pt-4 flex items-center text-sm font-medium text-primary-500 opacity-0 transition-opacity group-hover:opacity-100 dark:text-primary-400">
        Read article
        <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </article>
  );
}
