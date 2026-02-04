import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Load and parse a YAML file from the data directory
 */
export function loadYaml<T>(filePath: string): T {
  const fullPath = path.join(CONTENT_DIR, filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  return yaml.load(content) as T;
}

/**
 * Load site metadata configuration
 */
export function loadSiteMetadata() {
  return loadYaml<SiteMetadata>('siteMetadata.yml');
}

/**
 * Load about page content
 */
export function loadAboutContent() {
  return loadYaml<AboutContent>('about.yml');
}

/**
 * Load localization strings
 */
export function loadLocale(lang: 'zh' | 'en') {
  return loadYaml<LocaleStrings>(`locales/${lang}.yml`);
}

// Type definitions
export interface LocalizedString {
  zh: string;
  en: string;
}

export interface SiteMetadata {
  title: string;
  titleTemplate: string;
  author: string;
  description: string;
  language: string;
  siteUrl: string;
  siteRepo: string;
  profile: {
    name: string;
    name_zh: string;
    avatar: string;
    occupation: string;
    occupation_zh: string;
    company: string;
    company_zh: string;
    email: string;
  };
  social: {
    github: string;
    googleScholar: string;
    twitter: string;
    linkedin: string;
  };
  navigation: {
    title: LocalizedString;
    href: string;
  }[];
  seo: {
    socialBanner: string;
  };
  comments: {
    enabled: boolean;
    provider: string;
    giscus: {
      repo: string;
      repositoryId: string;
      category: string;
      categoryId: string;
    };
  };
  analytics: {
    googleAnalytics: string;
  };
}

export interface Experience {
  company: LocalizedString;
  role: LocalizedString;
  period: string;
  current?: boolean;
  link?: string;
}

export interface Publication {
  title: string;
  venue: string;
  authors: string;
  links: { name: string; url: string }[];
}

export interface Project {
  title: string;
  org: string;
  authors?: string;
  description: LocalizedString;
  links: { name: string; url: string }[];
}

export interface AboutContent {
  bio: LocalizedString;
  motto: LocalizedString;
  interests: LocalizedString;
  experiences: Experience[];
  publications: Publication[];
  projects: Project[];
}

export interface LocaleStrings {
  common: {
    readMore: string;
    backToBlog: string;
    allPosts: string;
    tags: string;
    postedOn: string;
    readingTime: string;
  };
  nav: {
    home: string;
    blog: string;
    tags: string;
    portfolio: string;
    about: string;
  };
  about: {
    title: string;
    experience: string;
    publications: string;
    projects: string;
    interests: string;
  };
  blog: {
    title: string;
    description: string;
    noResults: string;
    latestPosts: string;
  };
  home: {
    greeting: string;
    welcome: string;
  };
  tags: {
    title: string;
    allTags: string;
    postsTagged: string;
  };
  portfolio: {
    title: string;
    description: string;
  };
}
