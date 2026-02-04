'use client';

import { useRef, useState, MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PortfolioCardProps {
  title: string;
  description: string;
  tags: string[];
  status: string;
  href: string;
  isExternal?: boolean;
  category?: string;
  index: number;
  featured?: boolean;
  imgSrc?: string;
}

export default function PortfolioCard({
  title,
  description,
  tags,
  status,
  href,
  isExternal = false,
  index,
  featured = false,
  imgSrc,
}: PortfolioCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  const CardContent = (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative flex h-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary-500/10",
        featured ? "md:flex-row" : "flex-col"
      )}
    >
      {/* Spotlight Effect */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-10"
        style={{
          opacity,
          background: `radial-gradient(${featured ? 800 : 600}px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`,
        }}
      />
      
      {/* Gradient Background for Featured */}
      {featured && !imgSrc && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 pointer-events-none" />
      )}
      
      {/* Image (if available) */}
      {imgSrc && (
        <div className={cn(
          "relative overflow-hidden bg-gray-100 dark:bg-gray-800",
          featured ? "w-full md:w-2/5 h-48 md:h-auto" : "w-full h-48"
        )}>
          <Image
            src={imgSrc}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            sizes={featured ? "(max-width: 768px) 100vw, 40vw" : "(max-width: 768px) 100vw, 33vw"}
          />
        </div>
      )}

      {/* Border Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 z-10"
        style={{
          opacity,
          background: `radial-gradient(${featured ? 800 : 600}px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.4), transparent 40%)`,
          maskImage: "linear-gradient(#fff, #fff) content-box, linear-gradient(#fff, #fff)",
          WebkitMaskImage: "linear-gradient(#fff, #fff) content-box, linear-gradient(#fff, #fff)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />

      <div className={cn("relative flex flex-col h-full p-6", featured ? "md:w-3/5 md:p-8" : "w-full")}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isExternal ? (
               <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                 </svg>
               </div>
            ) : (
               <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                 </svg>
               </div>
            )}
            <span className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
              status === "completed" 
                ? "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                : "bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
            )}>
              {status === "completed" ? "Completed" : "In Progress"}
            </span>
          </div>
        </div>

        {/* Content */}
        <h3 className={cn(
          "font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors",
          featured ? "text-2xl md:text-3xl" : "text-xl"
        )}>
          {title}
        </h3>
        <p className={cn(
          "text-gray-600 dark:text-gray-400 leading-relaxed mb-6",
          featured ? "text-base md:text-lg line-clamp-4" : "text-sm line-clamp-3"
        )}>
          {description}
        </p>

        {/* Footer (Tags) */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/50">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-1 font-medium text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-500/10",
                  featured ? "text-sm bg-white/80 dark:bg-gray-800/80" : "text-xs bg-gray-50 dark:bg-gray-800"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="h-full"
    >
      {isExternal ? (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block h-full outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-xl"
        >
          {CardContent}
        </a>
      ) : (
        <Link 
          href={href}
          className="block h-full outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-xl"
        >
          {CardContent}
        </Link>
      )}
    </motion.div>
  );
}

