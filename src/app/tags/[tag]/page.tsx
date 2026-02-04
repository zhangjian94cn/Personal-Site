import Link from "next/link";
import { allBlogs } from "contentlayer/generated";
import { compareDesc } from "date-fns";
import type { Metadata } from "next";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

// Get all unique tags for static generation
export async function generateStaticParams() {
  const tags = new Set<string>();
  
  allBlogs
    .filter((post) => !post.draft)
    .forEach((post) => {
      post.tags?.forEach((tag) => {
        tags.add(tag.toLowerCase());
      });
    });
  
  return Array.from(tags).map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  
  return {
    title: `#${decodedTag}`,
    description: `所有包含 "${decodedTag}" 标签的文章`,
  };
}

// Group posts by year
function groupPostsByYear(posts: typeof allBlogs) {
  const groups: Record<string, typeof allBlogs> = {};
  
  posts.forEach((post) => {
    const year = new Date(post.date).getFullYear().toString();
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(post);
  });
  
  return Object.entries(groups)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .map(([year, posts]) => ({ year, posts }));
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  
  const posts = allBlogs
    .filter((post) => !post.draft)
    .filter((post) => 
      post.tags?.some((t) => t.toLowerCase() === decodedTag.toLowerCase())
    )
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)));

  const groupedPosts = groupPostsByYear(posts);

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          <span className="text-primary-500">#</span> {decodedTag}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          共 {posts.length} 篇文章
        </p>
        <Link
          href="/tags"
          className="inline-flex items-center gap-1 mt-2 text-sm text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
        >
          ← 所有标签
        </Link>
      </div>

      {/* Posts grouped by year */}
      <div className="space-y-8">
        {groupedPosts.map(({ year, posts: yearPosts }) => (
          <div key={year}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {year}
            </h2>
            <ul className="space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
              {yearPosts.map((post) => (
                <li key={post.slug} className="flex items-baseline gap-3">
                  <time 
                    dateTime={post.date}
                    className="text-sm text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap"
                  >
                    {new Date(post.date).toLocaleDateString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </time>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-gray-700 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
