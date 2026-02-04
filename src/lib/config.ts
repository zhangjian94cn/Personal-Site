// Site configuration - loads from data/siteMetadata.yml
// This file provides a typed interface to the site metadata

import siteMetadataYml from '@/../content/siteMetadata.yml';

interface SiteMetadata {
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
    title: { zh: string; en: string };
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

const siteMetadata = siteMetadataYml as unknown as SiteMetadata;

// Legacy siteConfig for backward compatibility
export const siteConfig = {
  name: siteMetadata.profile.name,
  title: siteMetadata.title,
  description: siteMetadata.description,
  url: siteMetadata.siteUrl,
  author: {
    name: siteMetadata.profile.name,
    email: siteMetadata.profile.email,
    bio: siteMetadata.profile.occupation,
    avatar: siteMetadata.profile.avatar,
  },
  links: {
    github: siteMetadata.social.github,
    googleScholar: siteMetadata.social.googleScholar,
  },
  // Navigation will be loaded dynamically based on language
  nav: siteMetadata.navigation.map(item => ({
    title: item.title.zh, // Default to Chinese
    href: item.href,
  })),
};

export { siteMetadata };
export type { SiteMetadata };
