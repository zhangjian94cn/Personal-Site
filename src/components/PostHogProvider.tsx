'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export function PostHogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const initializedRef = useRef(false);
  const lastTrackedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (initializedRef.current || !POSTHOG_KEY || !POSTHOG_HOST) {
      return;
    }

    if (window.location.protocol === 'https:' && POSTHOG_HOST.startsWith('http://')) {
      console.warn(
        '[PostHog] skipped initialization: HTTPS page cannot send events to HTTP host.'
      );
      return;
    }

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
      person_profiles: 'identified_only',
      loaded: (instance) => {
        if (process.env.NODE_ENV === 'development') {
          instance.debug();
        }
      },
    });

    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    const query = window.location.search.slice(1);
    const url = `${window.location.origin}${pathname}${query ? `?${query}` : ''}`;

    if (lastTrackedUrlRef.current === url) {
      return;
    }

    posthog.capture('$pageview', {
      $current_url: url,
    });
    lastTrackedUrlRef.current = url;
  }, [pathname]);

  return <>{children}</>;
}
