'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { siteMetadata } from '@/lib/config';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useRef } from 'react';

const GISCUS_ORIGIN = 'https://giscus.app';

const parseRepoFromUrl = (value: string) => {
  if (!value) {
    return '';
  }

  const normalized = value.trim();
  if (normalized.includes('/')) {
    const withoutProtocol = normalized
      .replace(/^https?:\/\/github\.com\//, '')
      .replace(/\.git$/, '')
      .replace(/\/$/, '');

    const [owner, repo] = withoutProtocol.split('/');
    if (owner && repo) {
      return `${owner}/${repo}`;
    }
  }

  return '';
};

const clean = (value: string | undefined) => (value ?? '').trim();

const buildConfig = () => {
  if (!siteMetadata.comments.enabled || siteMetadata.comments.provider !== 'giscus') {
    return null;
  }

  const repo =
    clean(process.env.NEXT_PUBLIC_GISCUS_REPO) ||
    clean(siteMetadata.comments.giscus.repo) ||
    parseRepoFromUrl(siteMetadata.siteRepo);

  const repoId =
    clean(process.env.NEXT_PUBLIC_GISCUS_REPO_ID) ||
    clean(siteMetadata.comments.giscus.repositoryId);

  const category =
    clean(process.env.NEXT_PUBLIC_GISCUS_CATEGORY) ||
    clean(siteMetadata.comments.giscus.category);

  const categoryId =
    clean(process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID) ||
    clean(siteMetadata.comments.giscus.categoryId);

  if (!repo || !repoId || !category || !categoryId) {
    return null;
  }

  return { repo, repoId, category, categoryId };
};

export default function GiscusComments() {
  const { lang } = useLanguage();
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const config = useMemo(() => buildConfig(), []);
  const theme = resolvedTheme === 'dark' ? 'dark_dimmed' : 'light';
  const giscusLang = lang === 'zh' ? 'zh-CN' : 'en';

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !config) {
      return;
    }

    const script = document.createElement('script');
    script.src = `${GISCUS_ORIGIN}/client.js`;
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.setAttribute('data-repo', config.repo);
    script.setAttribute('data-repo-id', config.repoId);
    script.setAttribute('data-category', config.category);
    script.setAttribute('data-category-id', config.categoryId);
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-lang', giscusLang);
    script.setAttribute('data-theme', theme);

    container.innerHTML = '';
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [config, giscusLang, theme]);

  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (!iframe?.contentWindow) {
      return;
    }

    iframe.contentWindow.postMessage(
      {
        giscus: {
          setConfig: {
            theme,
            lang: giscusLang,
          },
        },
      },
      GISCUS_ORIGIN
    );
  }, [theme, giscusLang]);

  if (!siteMetadata.comments.enabled || siteMetadata.comments.provider !== 'giscus') {
    return null;
  }

  if (!config) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          Giscus is enabled but missing config. Fill `comments.giscus` in `content/siteMetadata.yml` or set
          `NEXT_PUBLIC_GISCUS_*` variables.
        </p>
      );
    }
    return null;
  }

  return (
    <section className="mt-16">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {lang === 'zh' ? '评论' : 'Comments'}
      </h2>
      <div ref={containerRef} />
    </section>
  );
}
