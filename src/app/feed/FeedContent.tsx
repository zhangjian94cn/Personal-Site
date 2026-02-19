'use client';

import { useState, useMemo } from 'react';
import { FeedItem, type FeedPost } from '@/components/FeedItem';
import { useLanguage } from '@/components/LanguageProvider';
import { motion, AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
import { useFeedStream } from '@/hooks/useFeedStream';

interface FeedContentProps {
  initialPosts?: FeedPost[];
}

export default function FeedContent({ initialPosts = [] }: FeedContentProps) {
  const { t } = useLanguage();
  const { posts, loading, error } = useFeedStream(initialPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('All');

  // Extract unique sources for filter tabs
  const sources = useMemo(() => {
    const allSources = posts.map(p => p.tags?.[0]).filter(Boolean) as string[];
    return ['All', ...Array.from(new Set(allSources))];
  }, [posts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch =
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.linkTitle?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource = selectedSource === 'All' || post.tags?.[0] === selectedSource;

      return matchesSearch && matchesSource;
    });
  }, [posts, searchQuery, selectedSource]);

  // Masonry breakpoints
  const breakpointColumnsObj = {
    default: 2,
    1100: 2,
    700: 1
  };

  // Show loading skeleton only when we have no data at all
  const showSkeleton = loading && posts.length === 0;

  return (
    <div className="min-h-screen py-10">
      <div className="space-y-4 pb-8 pt-6 md:space-y-5 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-5xl"
        >
          {t('feed.title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg leading-7 text-gray-500 dark:text-gray-400 font-light"
        >
          {t('feed.description')}
        </motion.p>
      </div>

      <div className="container mx-auto px-4">
        {/* Controls */}
        <div className="mb-10 flex flex-col items-center gap-6">
          {/* Search Input */}
          <div className="relative w-full max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full rounded-full border-0 bg-gray-100 py-3 pl-10 pr-4 text-gray-900 focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
              placeholder={t('common.search') || 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Source Filters */}
          {posts.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {sources.map(source => (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${selectedSource === source
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                >
                  {source === 'All' ? (t('common.allPosts') || 'All') : source}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading Skeleton — only shown when no initial data */}
        {showSkeleton && (
          <div className="flex w-auto -ml-6">
            <div className="w-full pl-6 md:w-1/2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="mb-6 animate-pulse rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50 dark:bg-gray-800/80 dark:ring-gray-700/50">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="mt-4 h-14 w-full rounded-xl bg-gray-100 dark:bg-gray-900/50" />
                </div>
              ))}
            </div>
            <div className="hidden md:block w-1/2 pl-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="mb-6 animate-pulse rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50 dark:bg-gray-800/80 dark:ring-gray-700/50">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-5 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="mt-4 h-14 w-full rounded-xl bg-gray-100 dark:bg-gray-900/50" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feed Grid */}
        {!showSkeleton && (
          <>
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="flex w-auto -ml-6"
              columnClassName="pl-6 bg-clip-padding"
            >
              {filteredPosts.map((post, index) => (
                <div key={post.id} className="mb-6">
                  <FeedItem post={post} index={index} isGrid={true} />
                </div>
              ))}
            </Masonry>

            {filteredPosts.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                {t('feed.noContent') || 'No posts found matching your criteria.'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
