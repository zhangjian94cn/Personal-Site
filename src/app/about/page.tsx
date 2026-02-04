'use client';

import { useLanguage } from "@/components/LanguageProvider";
import { loadAboutContent, loadSiteMetadata, type AboutContent, type SiteMetadata } from "@/lib/content";

// Load data at build time (this will be replaced with proper server component pattern)
// For now, we'll use a hybrid approach
import aboutData from "@/../content/about.yml";
import siteData from "@/../content/siteMetadata.yml";

export default function AboutPage() {
  const { lang } = useLanguage();
  
  // Type assertions for the imported YAML data
  const about = aboutData as unknown as AboutContent;
  const site = siteData as unknown as SiteMetadata;
  
  const bio = about.bio[lang];
  const motto = about.motto[lang];
  const interests = (about.interests as unknown as { zh: string[]; en: string[] })[lang];
  
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {/* Bio Section */}
      <div className="space-y-2 pb-8 pt-6 md:space-y-5">
        <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
          {lang === 'zh' ? '关于我' : 'About Me'}
        </h1>
        <div className="flex flex-col md:flex-row gap-8 items-start pt-8">
          {/* Avatar Section */}
          <div className="md:w-1/3 flex flex-col items-center text-center">
            <div className="relative w-48 h-48 rounded-full overflow-hidden mb-4 border-4 border-gray-100 dark:border-gray-800 shadow-lg">
              <img 
                src={site.profile.avatar} 
                alt={site.profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {site.profile.name}
            </h3>
            <p className="text-primary-500 font-medium">
              {lang === 'zh' ? site.profile.occupation_zh : site.profile.occupation}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              AI / Computer Vision / Robotics
            </p>
          </div>

          {/* Bio Content */}
          <div className="md:w-2/3 flex flex-col justify-center">
            <div className="space-y-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              {/* Render bio with markdown-like formatting */}
              {/* Render bio with improved parsing */}
              <div className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                {bio.split('\n\n').map((block, index) => {
                  // Process inline formatting (Bold, Link)
                  const processInline = (text: string) => {
                    return text
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-gray-100">$1</strong>')
                      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="font-medium text-primary-500 hover:text-primary-600 underline decoration-primary-500/30 hover:decoration-primary-500 underline-offset-4 transition-all">$1</a>');
                  };

                  // Check if it's a list (starts with "- ")
                  if (block.trim().startsWith('- ')) {
                    const listItems = block
                      .split('\n')
                      .filter(line => line.trim().startsWith('- '))
                      .map(line => processInline(line.replace(/^- /, '')));

                    return (
                      <ul key={index} className="my-6 space-y-4">
                        {listItems.map((item, i) => (
                          <li key={i} className="relative pl-7 group">
                            <span className="absolute left-0 top-2.5 w-2 h-2 rounded-full bg-primary-400/60 group-hover:bg-primary-500 transition-colors" />
                            <span dangerouslySetInnerHTML={{ __html: item }} />
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  // Regular paragraph
                  return (
                    <p 
                      key={index} 
                      className="my-6 first:mt-0"
                      dangerouslySetInnerHTML={{ __html: processInline(block) }} 
                    />
                  );
                })}
              </div>

              {/* Research Interests */}
              <div>
                <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                  {lang === 'zh' ? '研究兴趣：' : 'Research Interests:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {interests.map(tag => (
                    <span 
                      key={tag} 
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Motto */}
              <p className="italic text-gray-500 dark:text-gray-400 text-base border-l-4 border-gray-200 dark:border-gray-700 pl-4 py-1">
                {motto}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Experience Section */}
      <div className="py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-2">
          <span className="text-primary-500">💼</span> 
          {lang === 'zh' ? '工作经历' : 'Experience'}
        </h2>
        <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-10">
          {about.experiences.map((exp, idx) => (
            <div key={idx} className="relative pl-8">
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-2 border-primary-500"></div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {exp.link ? (
                    <a href={exp.link} target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 transition-colors">
                      {exp.company[lang]} ↗
                    </a>
                  ) : (
                    exp.company[lang]
                  )}
                </h3>
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {exp.period}
                </span>
              </div>
              <p className="text-lg font-medium text-primary-600 dark:text-primary-400 mb-2">
                {exp.role[lang]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Publications Section */}
      <div className="py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-2">
          <span className="text-primary-500">📄</span> 
          {lang === 'zh' ? '学术发表' : 'Publications'}
        </h2>
        <div className="space-y-6">
          {about.publications.map((pub, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                {pub.title}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                  {pub.venue}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 italic leading-relaxed">
                {pub.authors}
              </p>
              <div className="flex gap-3">
                {pub.links.map((link, i) => (
                  <a 
                    key={i} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary-500 hover:text-primary-600 hover:underline flex items-center gap-1"
                  >
                    [{link.name}]
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div className="py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-2">
          <span className="text-primary-500">🚀</span> 
          {lang === 'zh' ? '项目经历' : 'Projects'}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {about.projects.map((proj, idx) => (
            <div key={idx} className="group relative border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-500 transition-colors">
                  {proj.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{proj.org}</p>
              </div>
              {proj.authors && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">{proj.authors}</p>
              )}
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                {proj.description[lang]}
              </p>
              <div className="flex gap-4 mt-auto">
                {proj.links.map((link, i) => (
                  <a 
                    key={i} 
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary-500 dark:hover:text-primary-400"
                  >
                    {link.name} ↗
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
