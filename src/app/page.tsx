
'use client';

import Link from "next/link";
import { allBlogs } from "contentlayer/generated";
import { compareDesc } from "date-fns";
import { Hero } from "@/components/ui/Hero";
import { PostCard } from "@/components/ui/PostCard";
import PortfolioCard from "@/components/PortfolioCard";
import portfolioData from "@/../content/portfolio.yml"; // Direct import for Client Component simplicity
import { useLanguage } from "@/components/LanguageProvider";
import { motion } from "framer-motion";

export default function Home() {
  const { lang, t } = useLanguage();

  const posts = allBlogs
    .filter((post) => !post.draft)
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
    .slice(0, 3); // Top 3 posts

  // Filter featured projects
  const featuredProjects = (portfolioData as any).projects.filter((p: any) => p.featured).slice(0, 4);

  return (
    <>
      <Hero />
      
      {/* Featured Projects Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 md:py-20 border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            Featured Works
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600 dark:text-gray-400">
            Selected projects showcasing AI agents, 3D reconstruction, and system design.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuredProjects.map((project: any, index: number) => (
             <div key={project.title.en} className={project.featured ? "md:col-span-2" : "md:col-span-1"}>
                <PortfolioCard
                  index={index}
                  title={project.title[lang]}
                  description={project.description[lang]}
                  tags={project.tags}
                  status={project.status}
                  href={project.blogSlug ? `/blog/${project.blogSlug}` : (project.projectPagePath || project.externalLink)}
                  isExternal={!!project.externalLink}
                  featured={true} // Always show as featured style on Home
                  imgSrc={project.imgSrc}
                />
             </div>
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <Link
            href="/portfolio"
            className="text-sm font-semibold leading-6 text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            View All Projects <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Latest Thoughts Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            Latest Thoughts
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600 dark:text-gray-400">
            Insights on Large Language Models, Engineering, and Continuous Learning.
          </p>
        </div>
        
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-12 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {posts.map((post, idx) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
           <Link
              href="/blog"
              className="inline-flex items-center justify-center rounded-full bg-white dark:bg-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Read More Article <span aria-hidden="true" className="ml-2">→</span>
            </Link>
        </div>
      </div>
    </>
  );
}
