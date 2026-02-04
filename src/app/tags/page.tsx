'use client';

import Link from "next/link";
import { allBlogs } from "contentlayer/generated";
import { useState } from "react";

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
    .map(([year, posts]) => ({ 
      year, 
      posts: posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }));
}

// Get all unique tags with counts
function getTagCounts(posts: typeof allBlogs) {
  const tagCounts: Record<string, number> = {};
  
  posts.forEach((post) => {
    post.tags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}

export default function TagsPage() {
  const allPosts = allBlogs.filter((post) => !post.draft);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Filter posts by selected tag
  const filteredPosts = selectedTag 
    ? allPosts.filter((post) => post.tags?.includes(selectedTag))
    : allPosts;
  
  const tags = getTagCounts(allPosts);
  const groupedPosts = groupPostsByYear(filteredPosts);

  return (
    <div className="py-10 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-start gap-8">
        {/* Left Sidebar: Tag Cloud (Desktop) / Top (Mobile) */}
        <div className="md:w-1/4 md:sticky md:top-24">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            🏷️ 标签筛选
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                selectedTag === null
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              全部
              <span className="opacity-80 text-xs bg-white/20 px-1.5 rounded ml-0.5">{allPosts.length}</span>
            </button>
            
            {tags.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedTag === tag
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {tag}
                <span className="opacity-60 text-xs ml-0.5">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content: Timeline */}
        <div className="md:w-3/4">
          <div className="space-y-12">
            {groupedPosts.map(({ year, posts }) => (
              <div key={year} className="relative">
                {/* Year Marker */}
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {year}
                  </h2>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                </div>
                
                <div className="space-y-8">
                  {posts.map((post) => (
                    <article key={post.slug} className="group relative flex flex-col sm:flex-row gap-2 sm:gap-8 items-start">
                      {/* Date (Left Side) */}
                      <div className="sm:w-24 text-gray-500 dark:text-gray-400 font-mono text-sm pt-1 shrink-0">
                        {new Date(post.date).toLocaleDateString("zh-CN", {
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 relative">
                        {/* Timeline styles - simplified: just clean list with hover effects */}
                        <div className="absolute -left-[41px] top-2 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-950 group-hover:bg-primary-500 group-hover:scale-110 transition-all hidden sm:block"></div>
                        {/* Connecting Line (Optional, visual aid) */}
                        <div className="absolute -left-[36px] top-5 bottom-[-32px] w-px bg-gray-200 dark:bg-gray-800 hidden sm:block last:hidden"></div>

                        <Link 
                          href={`/blog/${post.slug}`} 
                          className="block p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-white hover:shadow-lg dark:hover:bg-gray-800 hover:scale-[1.01] border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all duration-300"
                        >
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-500 transition-colors">
                            {post.title}
                          </h3>
                          {post.summary && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                              {post.summary}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-4">
                            {post.tags?.map(tag => (
                              <span key={tag} className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                # {tag}
                              </span>
                            ))}
                          </div>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                该标签下暂无文章
              </p>
              <button 
                onClick={() => setSelectedTag(null)}
                className="mt-4 text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                查看全部文章
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
