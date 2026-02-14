import { ReactNode } from "react";
import Link from "next/link";
import { Blog, Authors } from "contentlayer/generated";
import { TableOfContents } from "@/components/TableOfContents";
import GiscusComments from "@/components/comments/GiscusComments";

interface PostLayoutProps {
  content: Blog;
  authorDetails: Authors[];
  next?: Blog | null;
  prev?: Blog | null;
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
    <article className="min-h-screen bg-white dark:bg-gray-950">
      <div className="container mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:gap-16">
           
           {/* Sidebar / TOC (Desktop) - Left Side */}
           <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <div className="sticky top-24 overflow-y-auto max-h-[calc(100vh-8rem)]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">
                On this page
              </h3>
              {content.toc && content.toc.length > 0 && (
                <TableOfContents toc={content.toc} />
              )}
            </div>
          </aside>

          {/* Article Content & Header - Right Side */}
          <main className="flex-1 min-w-0">
            
            {/* Header Section (Now inside Main) */}
            <header className="mb-10 border-b border-gray-200 pb-10 dark:border-gray-800">
               <div className="space-y-4">
                 {/* Date & Reading Time */}
                 <div className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                   <time dateTime={date}>
                     {new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                   </time>
                   <span>•</span>
                   <span>{readingTime?.text}</span>
                 </div>

                 {/* Title */}
                 <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
                   {title}
                 </h1>

                 {/* Subtitle */}
                 {subtitle && (
                    <p className="text-xl text-gray-500 dark:text-gray-400">
                      {subtitle}
                    </p>
                 )}

                 {/* Author & Tags */}
                 <div className="flex flex-col items-start gap-4 pt-4 sm:flex-row sm:justify-between sm:items-center">
                    {/* Author */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">By</span>
                      {authorDetails.map((author, idx) => (
                        <span key={author.name} className="flex items-center space-x-2">
                           <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{author.name}</span>
                           {idx < authorDetails.length - 1 && <span>, </span>}
                        </span>
                      ))}
                    </div>

                    {/* Tags */}
                    {tags && tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Link
                            key={tag}
                            href={`/tags/${tag.toLowerCase()}`}
                            className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold uppercase text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            {tag}
                          </Link>
                        ))}
                      </div>
                    )}
                 </div>
               </div>
            </header>

            {/* Content Display */}
            <div className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:scroll-mt-20
              prose-a:text-primary-600 hover:prose-a:text-primary-500 dark:prose-a:text-primary-400
              prose-img:rounded-xl prose-img:shadow-lg
            ">
              {children}
            </div>

            <GiscusComments />

            {/* Post Navigation */}
            <hr className="my-12 border-gray-200 dark:border-gray-800" />
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {prev && prev.slug && (
                 <div className="flex flex-col items-start text-left">
                   <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                     Previous Article
                   </span>
                   <Link 
                     href={`/blog/${prev.slug}`}
                     className="text-lg font-bold text-gray-900 hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-400"
                   >
                     &larr; {prev.title}
                   </Link>
                 </div>
              ) || <div />} {/* Spacer if no prev */}
              
              {next && next.slug && (
                <div className="flex flex-col items-end text-right">
                  <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Next Article
                  </span>
                   <Link 
                     href={`/blog/${next.slug}`}
                     className="text-lg font-bold text-gray-900 hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-400"
                   >
                     {next.title} &rarr;
                   </Link>
                </div>
              )}
            </div>
            
             <div className="mt-16 text-center">
              <Link
                href="/blog"
                className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                View All Articles
              </Link>
            </div>

          </main>
        </div>
      </div>
    </article>
  );
}
