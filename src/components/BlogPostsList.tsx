'use client';

import { useState } from 'react';
import { Blog } from 'contentlayer/generated';
import { motion, AnimatePresence } from 'framer-motion';
import { PostCard } from '@/components/ui/PostCard';
import { SearchInput } from '@/components/ui/SearchInput';

interface BlogPostsListProps {
  posts: Blog[];
  tags: string[];
}

export default function BlogPostsList({ posts, tags }: BlogPostsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Filter posts based on search query and selected tag
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = selectedTag ? post.tags?.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  // Determine if we are in "Default View" (no search, no tag)
  const isDefaultView = !searchQuery && !selectedTag;
  
  // In Default View, pick the first one as featured. 
  // In Search/Filter View, show everything in the grid.
  const featuredPost = isDefaultView && filteredPosts.length > 0 ? filteredPosts[0] : null;
  const gridPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts;

  return (
    <div className="space-y-8">
      {/* Search and Filter Section */}
      <section className="space-y-6">
        <div className="max-w-2xl mx-auto">
          <SearchInput 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="搜索文章标题或简介..."
          />
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedTag === null
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 scale-105'
                : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
            }`}
          >
            全部
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedTag === tag
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 scale-105'
                  : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Post Hero - Only on Default View */}
      {featuredPost && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg group hover:shadow-xl transition-all"
        >
          <div className="relative isolate px-6 pt-8 pb-8 sm:px-10 sm:pt-10 sm:pb-10">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex flex-wrap justify-center gap-2">
                   {featuredPost.tags?.map(tag => (
                      <span key={tag} className="rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold leading-5 text-primary-600 dark:text-primary-400">
                        {tag}
                      </span>
                   ))}
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  <a href={`/blog/${featuredPost.slug}`}>
                    <span className="absolute inset-0" />
                    {featuredPost.title}
                  </a>
                </h2>
                <p className="max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300 mb-6 line-clamp-2">
                  {featuredPost.summary}
                </p>
                <div className="flex items-center text-sm font-medium text-primary-600 dark:text-primary-400">
                   Read Featured Article <span aria-hidden="true" className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
          </div>
        </motion.div>
      )}

      {/* Posts Grid */}
      <motion.div 
        layout
        className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode='popLayout'>
          {gridPosts.map((post) => (
            <motion.div
              key={post.slug}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* No Results State */}
      {filteredPosts.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">没有找到相关文章</h3>
          <p className="text-gray-500 dark:text-gray-400">
            尝试更换搜索关键词或清除筛选条件
          </p>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
            className="mt-6 text-primary-500 hover:text-primary-600 font-medium"
          >
            清除所有筛选
          </button>
        </motion.div>
      )}
    </div>
  );
}
