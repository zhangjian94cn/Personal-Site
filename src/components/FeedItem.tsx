'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export interface FeedPost {
  id: string | number;
  content: string;
  date: string;
  type: 'thought' | 'link' | 'image' | 'article';
  tags?: string[];
  link?: string;
  linkTitle?: string;
  images?: string[];
}

export function FeedItem({ post, index, isGrid = false }: { post: FeedPost; index: number; isGrid?: boolean }) {
  const isLink = post.type === 'link';
  const isImage = post.type === 'image';
  const isEven = index % 2 === 0;

  if (isGrid) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "50px" }}
          transition={{ duration: 0.4 }}
          className="group relative flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50 transition-all hover:shadow-md hover:shadow-primary-500/5 hover:-translate-y-1 dark:bg-gray-800/80 dark:ring-gray-700/50 dark:hover:bg-gray-800"
        >
             {/* Header: Source & Date */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
                 {post.tags?.[0] && (
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 font-medium text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                        {post.tags[0]}
                    </span>
                 )}
                 <span className="text-gray-300 dark:text-gray-600">•</span>
                 <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric'
                  })}
                 </time>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <p className="whitespace-pre-wrap leading-relaxed line-clamp-4">{post.content}</p>
          </div>

          {/* Link Card (Restored Richness) */}
          {isLink && post.link && (
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link mt-1 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-100 hover:border-primary-200 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-gray-800 dark:hover:border-primary-800"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100 group-hover/link:ring-primary-100 dark:bg-gray-800 dark:ring-gray-700 dark:group-hover/link:ring-primary-900 transition-all">
                 <img 
                    src={`https://www.google.com/s2/favicons?domain=${new URL(post.link).hostname}&sz=64`} 
                    alt="" 
                    className="h-5 w-5 opacity-90 transition-transform group-hover/link:scale-110"
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                      // Fallback to SVG icon could go here via parent manipulation, but keeping simple for now
                    }}
                 />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-gray-900 dark:text-gray-100 group-hover/link:text-primary-600 dark:group-hover/link:text-primary-400 transition-colors">
                  {post.linkTitle || post.link}
                </div>
                <div className="truncate text-xs text-gray-500 mt-0.5">
                  {new URL(post.link).hostname}
                </div>
              </div>
            </a>
          )}

          {/* Images */}
          {isImage && post.images && (
            <div className="mt-2 overflow-hidden rounded-lg">
               <img src={post.images[0]} alt="" className="w-full object-cover" />
            </div>
          )}
        </motion.div>
      )
  }

  // Legacy Timeline Layout (Fallback)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative flex items-center md:justify-between ${
        isEven ? 'md:flex-row-reverse' : ''
      }`}
    >
      {/* Timeline Dot */}
      <div className="absolute left-6 md:left-1/2 w-4 h-4 -ml-2 rounded-full border-4 border-white dark:border-gray-900 bg-primary-500 z-10 shadow-sm" />

      {/* Spacer for Desktop Layout */}
      <div className="hidden md:block w-5/12" />

      {/* Content Card */}
      <div className="ml-12 md:ml-0 w-full md:w-5/12">
        <div className="group relative flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50 transition-all hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1 dark:bg-gray-800/80 dark:ring-gray-700/50 dark:hover:bg-gray-800">
          {/* Header: Date & Tags */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <time dateTime={post.date} className="font-mono">
              {new Date(post.date).toLocaleDateString('zh-CN', {
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
              })}
            </time>
            <div className="flex flex-wrap gap-2">
              {post.tags?.map(tag => (
                <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </div>

          {/* Link Card */}
          {isLink && post.link && (
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-100 hover:border-primary-200 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-gray-800 dark:hover:border-primary-800"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100 group-hover/link:ring-primary-100 dark:bg-gray-800 dark:ring-gray-700 dark:group-hover/link:ring-primary-900 transition-all">
                <svg className="h-5 w-5 text-gray-400 group-hover/link:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate font-medium text-gray-900 dark:text-gray-100 group-hover/link:text-primary-600 dark:group-hover/link:text-primary-400 transition-colors">
                  {post.linkTitle || post.link}
                </span>
                <span className="truncate text-xs text-gray-500">{new URL(post.link).hostname}</span>
              </div>
            </a>
          )}

          {/* Images */}
          {isImage && post.images && (
            <div className={`grid gap-2 mt-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {post.images.map((img, i) => (
                <div key={i} className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/5">
                  <img 
                    src={img} 
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
