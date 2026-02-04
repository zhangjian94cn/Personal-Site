import { allBlogs } from "contentlayer/generated";
import { compareDesc } from "date-fns";
import type { Metadata } from "next";
import BlogPostsList from "@/components/BlogPostsList";

export const metadata: Metadata = {
  title: "Blog - Zhang Jian",
  description: "Writing on software design, AI technology, and systematic thinking.",
};

export default function BlogPage() {
  const posts = allBlogs
    .filter((post) => !post.draft)
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)));

  // Extract all unique tags for the filter
  const allTags = Array.from(new Set(posts.flatMap(post => post.tags || []))).sort();

  return (
    <div className="py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6">
            技术博客
          </h1>
          <p className="text-lg leading-8 text-gray-600 dark:text-gray-400">
            探索 AI 技术、系统架构与软件工程的深度实践。
          </p>
        </div>
        
        <BlogPostsList posts={posts} tags={allTags} />
      </div>
    </div>
  );
}
