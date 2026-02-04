'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import portfolioData from "@/../content/portfolio.yml";
import PortfolioCard from "@/components/PortfolioCard";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  title: { zh: string; en: string };
  description: { zh: string; en: string };
  tags: string[];
  status: string;
  blogSlug?: string;
  externalLink?: string;
  projectSlug?: string;
  projectPagePath?: string;
  featured?: boolean;
  imgSrc?: string;
}

interface PortfolioData {
  projects: Project[];
}

// Category mapping logic
const CATEGORIES = ["All", "AI/LLM", "Systems", "CV"] as const;
type Category = typeof CATEGORIES[number];

const TAG_CATEGORY_MAP: Record<string, Category> = {
  "LLM": "AI/LLM",
  "ChatGLM": "AI/LLM", 
  "RAG": "AI/LLM",
  "Fine-tuning": "AI/LLM",
  "LangChain": "AI/LLM",
  "Ray": "Systems",
  "Distributed": "Systems",
  "Vector DB": "Systems",
  "Finance": "AI/LLM",
  "CV": "CV",
  "Segmentation": "CV",
  "NeRF": "CV",
  "3D": "CV",
  "Neural Rendering": "CV",
  "PyTorch": "AI/LLM"
};

export default function PortfolioPage() {
  const { t, lang } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  
  const data = portfolioData as unknown as PortfolioData;

  // Filter projects based on category
  const filteredProjects = useMemo(() => {
    if (selectedCategory === "All") return data.projects;
    
    return data.projects.filter(project => {
      // Check if any of the project's tags map to the selected category
      return project.tags.some(tag => TAG_CATEGORY_MAP[tag] === selectedCategory);
    });
  }, [selectedCategory, data.projects]);

  // Project link logic
  const getProjectLink = (project: Project): { href: string; external: boolean } | null => {
    if (project.blogSlug) return { href: `/blog/${project.blogSlug}`, external: false };
    if (project.projectPagePath) return { href: project.projectPagePath, external: false };
    if (project.externalLink) return { href: project.externalLink, external: true };
    if (project.projectSlug) return { href: `/portfolio/${project.projectSlug}`, external: false };
    return null;
  };

  return (
    <div className="min-h-screen py-12 md:py-20">
      {/* Hero Section */}
      <div className="mb-16 space-y-6 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl md:text-6xl"
        >
          {t('portfolio.title')}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-2xl text-lg text-gray-500 dark:text-gray-400 md:text-xl"
        >
          {t('portfolio.subtitle')}
        </motion.p>
      </div>

      {/* Category Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex justify-center mb-12"
      >
        <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                selectedCategory === category
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {selectedCategory === category && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 bg-white dark:bg-gray-700 shadow-sm rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{category}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Projects Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => {
            const link = getProjectLink(project);
            if (!link) return null;

            // Only allow 2-column span if we are viewing "All" category to prevent gaps in filtered views
            const isFeatured = project.featured && selectedCategory === "All";

            return (
              <motion.div
                key={project.title.en}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={isFeatured ? "md:col-span-2" : "md:col-span-1"}
              >
                <PortfolioCard
                  index={index}
                  title={project.title[lang]}
                  description={project.description[lang]}
                  tags={project.tags}
                  status={project.status}
                  href={link.href}
                  isExternal={link.external}
                  featured={isFeatured}
                  imgSrc={project.imgSrc}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
      
      {filteredProjects.length === 0 && (
         <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No projects found in this category.
            </p>
         </div>
      )}

      {/* CTA */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mt-20 text-center"
      >
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">
          {t('portfolio.cta')}
        </p>
        <Link
          href="/about"
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-primary-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary-700 hover:scale-105 active:scale-95"
        >
          <span className="mr-2">{t('portfolio.contact')}</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </motion.div>
    </div>
  );
}
