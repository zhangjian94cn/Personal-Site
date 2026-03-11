'use client';

import Link from 'next/link';
import { useState } from 'react';
import { siteConfig } from '@/lib/config';
import { ThemeSwitch } from './ThemeSwitch';
import { LanguageSwitch } from './LanguageSwitch';
import { useLanguage } from '@/components/LanguageProvider';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { title: t('nav.home'), href: '/' },
    { title: t('nav.blog'), href: '/blog' },
    { title: t('nav.tags'), href: '/tags' },
    { title: t('nav.portfolio'), href: '/portfolio' },
    { title: t('nav.about'), href: '/about' },
  ];

  return (
    <header className="flex items-center w-full bg-white dark:bg-gray-900 justify-between py-10">
      <div>
        <Link href="/" aria-label={siteConfig.name}>
          <div className="flex items-center justify-between">
            <div className="mr-3 text-2xl font-semibold text-primary-500">
              {siteConfig.name}
            </div>
          </div>
        </Link>
      </div>
      <div className="flex items-center space-x-4 leading-5 sm:space-x-6">
        <div className="hidden items-center gap-x-4 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-500 dark:hover:text-primary-400"
            >
              {link.title}
            </Link>
          ))}
        </div>
        <LanguageSwitch />
        <ThemeSwitch />
        {/* Mobile Nav */}
        <div className="sm:hidden">
          <button
            className="h-8 w-8 rounded p-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-6 w-6 text-gray-900 dark:text-gray-100"
            >
              {isMenuOpen ? (
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 sm:hidden">
          <div className="flex h-full flex-col">
            <div className="flex justify-end p-4">
              <button
                className="h-8 w-8 rounded p-1"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close Menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-6 w-6 text-gray-900 dark:text-gray-100"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col items-center space-y-8 px-8 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="text-2xl font-bold tracking-wide text-gray-900 dark:text-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
