'use client';

import { useState, useEffect } from 'react';
import { type FeedPost } from '@/components/FeedItem';
import { feedSources, type FeedSource, type FeedItem as FeedItemData } from '@/lib/feed';

/* ------------------------------------------------------------------ */
/*  Lightweight browser-side XML → FeedItem parser                    */
/* ------------------------------------------------------------------ */

const stripHtml = (v: string) => v.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const txt = (el: Element, names: string[]): string | undefined => {
    for (const n of names) {
        const node = el.getElementsByTagName(n)[0];
        const t = node?.textContent?.trim();
        if (t) return t;
    }
    return undefined;
};

const atomLink = (entry: Element): string | undefined => {
    const links = Array.from(entry.getElementsByTagName('link'));
    const alt = links.find((l) => l.getAttribute('rel') === 'alternate');
    if (alt) {
        const href = alt.getAttribute('href')?.trim();
        if (href) return href;
    }
    for (const l of links) {
        const href = l.getAttribute('href')?.trim();
        if (href) return href;
    }
    return txt(entry, ['link', 'id']);
};

const normalizeDate = (d?: string) => {
    if (!d) return undefined;
    const ts = Date.parse(d);
    return Number.isNaN(ts) ? undefined : new Date(ts).toISOString();
};

const parseCategory = (entry: Element, isAtom: boolean): string[] => {
    const nodes = Array.from(entry.getElementsByTagName('category'));
    const cats = nodes
        .map((n) => (isAtom ? n.getAttribute('term') : n.textContent)?.trim())
        .filter((v): v is string => Boolean(v));
    return Array.from(new Set(cats));
};

const normalizeLink = (link: string) => {
    try { return new URL(link).toString(); } catch { return link; }
};

const parseEntry = (
    entry: Element,
    source: FeedSource,
    sourceTitle: string,
    isAtom: boolean,
): FeedItemData | undefined => {
    const title = txt(entry, ['title']);
    if (!title) return undefined;

    const rawLink = isAtom ? atomLink(entry) : txt(entry, ['link', 'guid']);
    if (!rawLink) return undefined;

    const description = txt(entry, ['description', 'content:encoded', 'summary', 'content']);

    const item: FeedItemData = {
        id: `${source.id}-${rawLink}`,
        sourceId: source.id,
        sourceTitle,
        title,
        link: normalizeLink(rawLink),
        category: parseCategory(entry, isAtom),
    };

    if (description) item.description = stripHtml(description);

    const pubDate = normalizeDate(txt(entry, ['pubDate', 'published', 'updated', 'dc:date']));
    if (pubDate) item.pubDate = pubDate;

    return item;
};

const parseFeed = (xml: string, source: FeedSource): FeedItemData[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const err = doc.getElementsByTagName('parsererror')[0];
    if (err) throw new Error(`Invalid XML from ${source.route}`);

    const channel = doc.getElementsByTagName('channel')[0];
    const feedRoot = doc.getElementsByTagName('feed')[0];
    const sourceTitle =
        txt(channel ?? feedRoot ?? doc.documentElement, ['title']) ?? source.title.en;

    const items = Array.from(doc.getElementsByTagName('item'));
    const isAtom = items.length === 0;
    const entries = isAtom ? Array.from(doc.getElementsByTagName('entry')) : items;

    const result: FeedItemData[] = [];
    for (const entry of entries) {
        const item = parseEntry(entry, source, sourceTitle, isAtom);
        if (item) result.push(item);
    }
    return result;
};

/* ------------------------------------------------------------------ */
/*  Fetch all sources in parallel (browser-side)                      */
/* ------------------------------------------------------------------ */

const rsshubBase = (process.env.NEXT_PUBLIC_RSSHUB_BASE ?? 'http://124.222.119.248:1200').replace(/\/$/, '');
const weweRssBase = (process.env.NEXT_PUBLIC_WEWE_RSS_BASE ?? 'http://124.222.119.248:14000').replace(/\/$/, '');

async function fetchFeedStreamClient(limit = 80): Promise<FeedItemData[]> {
    const settled = await Promise.allSettled(
        feedSources.map(async (source) => {
            const base = source.baseUrl ?? rsshubBase;
            const res = await fetch(`${base}${source.route}`);
            if (!res.ok) throw new Error(`${source.route} → HTTP ${res.status}`);
            const xml = await res.text();
            return parseFeed(xml, source);
        }),
    );

    const fulfilled: FeedItemData[][] = [];
    for (const r of settled) {
        if (r.status === 'fulfilled') fulfilled.push(r.value);
    }

    if (fulfilled.length === 0) {
        const fail = settled.find(
            (r): r is PromiseRejectedResult => r.status === 'rejected',
        );
        throw new Error(
            fail?.reason instanceof Error ? fail.reason.message : 'Unable to load RSS feed stream.',
        );
    }

    const merged = fulfilled
        .flat()
        .sort((a, b) => {
            const at = a.pubDate ? Date.parse(a.pubDate) : 0;
            const bt = b.pubDate ? Date.parse(b.pubDate) : 0;
            if (at === bt) return a.title.localeCompare(b.title);
            return bt - at;
        })
        .slice(0, limit);

    const seen = new Set<string>();
    return merged.filter((item) => {
        if (seen.has(item.link)) return false;
        seen.add(item.link);
        return true;
    });
}

/* ------------------------------------------------------------------ */
/*  React Hook                                                        */
/* ------------------------------------------------------------------ */

function toFeedPost(item: FeedItemData): FeedPost {
    return {
        id: item.id,
        content: item.description || item.title,
        date: item.pubDate || new Date().toISOString(),
        type: 'link' as const,
        tags: [item.sourceTitle, ...(item.category || [])],
        link: item.link,
        linkTitle: item.title,
    };
}

export interface UseFeedStreamResult {
    posts: FeedPost[];
    loading: boolean;
    error: string | null;
}

export function useFeedStream(initialPosts: FeedPost[] = []): UseFeedStreamResult {
    const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetchFeedStreamClient()
            .then((items) => {
                if (!cancelled) {
                    setPosts(items.map(toFeedPost));
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load feed.');
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, []);

    return { posts, loading, error };
}
