import Link from "next/link";
import { allBlogs } from "contentlayer/generated";
import { compareDesc } from "date-fns";
import { siteConfig } from "@/lib/config";

export default function Home() {
  const posts = allBlogs
    .filter((post) => !post.draft)
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
    .slice(0, 5);

  return (
    <>
      {/* Hero Section */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            {siteConfig.name}
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            {siteConfig.description}
          </p>
        </div>

        {/* Latest Posts */}
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {posts.length === 0 && (
            <li className="py-12">
              <p className="text-gray-500 dark:text-gray-400">
                暂无文章，敬请期待...
              </p>
            </li>
          )}
          {posts.map((post) => {
            const { slug, date, title, summary, tags } = post;
            return (
              <li key={slug} className="py-12">
                <article>
                  <div className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                    <dl>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>
                          {new Date(date).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </time>
                      </dd>
                    </dl>
                    <div className="space-y-5 xl:col-span-3">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold leading-8 tracking-tight">
                            <Link
                              href={`/blog/${slug}`}
                              className="text-gray-900 dark:text-gray-100"
                            >
                              {title}
                            </Link>
                          </h2>
                          <div className="flex flex-wrap">
                            {tags?.map((tag) => (
                              <Link
                                key={tag}
                                href={`/tags/${tag.toLowerCase()}`}
                                className="mr-3 text-sm font-medium uppercase text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                              >
                                {tag}
                              </Link>
                            ))}
                          </div>
                        </div>
                        <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                          {summary}
                        </div>
                      </div>
                      <div className="text-base font-medium leading-6">
                        <Link
                          href={`/blog/${slug}`}
                          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                          aria-label={`Read more: "${title}"`}
                        >
                          阅读更多 &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>

      {posts.length > 0 && (
        <div className="flex justify-end text-base font-medium leading-6">
          <Link
            href="/blog"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="All posts"
          >
            全部文章 &rarr;
          </Link>
        </div>
      )}
    </>
  );
}
