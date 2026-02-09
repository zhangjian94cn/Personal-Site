'use client';

import { useLanguage } from "@/components/LanguageProvider";
import { loadAboutContent, loadSiteMetadata, type AboutContent, type SiteMetadata } from "@/lib/content";
import { motion } from "framer-motion";
import Image from "next/image";

// Load data at build time
import aboutData from "@/../content/about.yml";
import siteData from "@/../content/siteMetadata.yml";

export default function AboutPage() {
  const { lang } = useLanguage();
  
  const about = aboutData as unknown as AboutContent;
  const site = siteData as unknown as SiteMetadata;
  
  const bio = about.bio[lang];
  const motto = about.motto[lang];
  const interests = (about.interests as unknown as { zh: string[]; en: string[] })[lang];
  
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {/* Bio Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2 pb-8 pt-6 md:space-y-5"
      >
        <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
          {lang === 'zh' ? '关于我' : 'About Me'}
        </h1>
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start pt-8">
          {/* Avatar Section */}
          <div className="w-full md:w-1/3 flex flex-col items-center text-center md:sticky md:top-24">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden mb-6 border border-gray-200 dark:border-gray-800 shadow-2xl md:rotate-3 hover:rotate-0 transition-transform duration-500">
               {/* Use Next/Image if valid path, otherwise fallback to img tag for external/static */}
               <img 
                 src={site.profile.avatar} 
                 alt={site.profile.name}
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-2xl" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {site.profile.name}
            </h3>
            <p className="text-primary-600 dark:text-primary-400 font-semibold text-lg mb-4">
              {lang === 'zh' ? site.profile.occupation_zh : site.profile.occupation}
            </p>
            
            {/* Tech Stack / Interests Generic Grid */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
               {interests.map((tag, i) => (
                  <span 
                    key={tag}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                  >
                    {tag}
                  </span>
               ))}
            </div>
          </div>

          {/* Bio Content */}
          <div className="md:w-2/3 flex flex-col justify-center">
            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
              {/* Motto Quote */}
              <blockquote className="not-italic border-l-4 border-primary-500 pl-6 py-2 mb-10 bg-gray-50 dark:bg-gray-800/50 rounded-r-xl">
                 <p className="text-xl font-serif italic text-gray-800 dark:text-gray-200 m-0">"{motto}"</p>
              </blockquote>

              {/* Bio Text Rendering */}
              {bio.split('\n\n').map((block, index) => {
                  const processInline = (text: string) => {
                    return text
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-gray-100">$1</strong>')
                      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="font-medium text-primary-600 hover:text-primary-500 underline decoration-primary-500/30 hover:decoration-primary-500 underline-offset-4 transition-all">$1</a>');
                  };

                  if (block.trim().startsWith('- ')) {
                    const listItems = block.split('\n').filter(line => line.trim().startsWith('- ')).map(line => processInline(line.replace(/^- /, '')));
                    return (
                      <ul key={index} className="list-none space-y-3 my-6 pl-0">
                        {listItems.map((item, i) => (
                          <li key={i} className="flex gap-3 items-start text-base">
                            <span className="mt-2 w-1.5 h-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                            <span dangerouslySetInnerHTML={{ __html: item }} />
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={index} className="mb-6 font-light" dangerouslySetInnerHTML={{ __html: processInline(block) }} />;
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Experience Section */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-12 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xl">
             💼
          </span>
          {lang === 'zh' ? '职业经历' : 'Experience'}
        </h2>
        <div className="relative border-l border-gray-200 dark:border-gray-800 ml-5 space-y-12">
          {about.experiences.map((exp, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-10"
            >
              <div className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-gray-950 ${exp.current ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {exp.link ? (
                    <a href={exp.link} target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 transition-colors inline-flex items-center gap-1">
                      {exp.company[lang]} 
                      <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  ) : (
                    exp.company[lang]
                  )}
                </h3>
                <span className={`text-sm font-mono px-2.5 py-0.5 rounded-full border ${exp.current 
                   ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                   : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}>
                  {exp.period}
                </span>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                {exp.role[lang]}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Publications Section */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-12 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xl">
             📚
          </span>
          {lang === 'zh' ? '学术发表' : 'Publications'}
        </h2>
        <div className="grid gap-6">
          {about.publications.map((pub, idx) => (
            <motion.div 
               key={idx}
               initial={{ opacity: 0, y: 10 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="group relative bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-4">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
                   {pub.title}
                 </h3>
                 <span className="flex-shrink-0 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-100 dark:border-purple-800">
                   {pub.venue}
                 </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-light">
                {pub.authors}
              </p>
              <div className="flex gap-4">
                {pub.links.map((link, i) => (
                  <a 
                    key={i} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1.5 transition-colors"
                  >
                    {link.name} 
                    <span className="text-xs">↗</span>
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-12 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xl">
             🚀
          </span>
          {lang === 'zh' ? '早期项目' : 'Past Projects'}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {about.projects.map((proj, idx) => (
            <motion.div 
               key={idx}
               whileHover={{ y: -5 }}
               className="flex flex-col h-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                {proj.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide font-semibold">
                {proj.org}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 flex-grow">
                {proj.description[lang]}
              </p>
              <div className="flex gap-4 mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                {proj.links.map((link, i) => (
                  <a 
                    key={i} 
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
