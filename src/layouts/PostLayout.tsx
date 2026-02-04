import { ReactNode } from "react";
import Link from "next/link";
import { Blog, Authors } from "contentlayer/generated";
import { TableOfContents } from "@/components/TableOfContents";

interface PostLayoutProps {
  content: Blog;
  authorDetails: Authors[];
  next?: { slug: string; title: string };
  prev?: { slug: string; title: string };
  children: ReactNode;
}

export default function PostLayout({
  content,
  authorDetails,
  next,
  prev,
  children,
}: PostLayoutProps) {
  const { date, title, subtitle, tags, readingTime } = content;

  return (
    <article className="min-h-screen">
      {/* Header Section - Matching original Jekyll style */}
      <header className="py-16 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Tags above title */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${tag.toLowerCase()}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 uppercase"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {title}
          </h1>
          
          {/* Subtitle */}
          {subtitle && (
            <h2 className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mt-3 font-normal">
              {subtitle}
            </h2>
          )}

          {/* Meta: Author and Date */}
          <div className="mt-6 text-gray-500 dark:text-gray-400">
            Posted by{" "}
            {authorDetails.map((author, idx) => (
              <span key={author.name}>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {author.name}
                </span>
                {idx < authorDetails.length - 1 && ", "}
              </span>
            ))}{" "}
            on{" "}
            <time dateTime={date}>
              {new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col lg:flex-row lg:gap-12">
          {/* Main Content */}
          <div className="flex-1 lg:max-w-3xl">
            <div className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
              prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
              prose-a:text-primary-600 hover:prose-a:text-primary-500 dark:prose-a:text-primary-400
              prose-li:text-gray-700 dark:prose-li:text-gray-300
              prose-blockquote:border-primary-500 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-md
              prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:rounded-lg
              prose-img:rounded-lg
            ">
              {children}
            </div>

            {/* Back to Blog Link */}
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/blog"
                className="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回博客
              </Link>
            </div>
          </div>

          {/* Sidebar / TOC */}
          <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <div className="sticky top-24">
              {content.toc && content.toc.length > 0 && (
                <TableOfContents toc={content.toc} />
              )}
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
