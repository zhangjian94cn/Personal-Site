export interface FeedSource {
  id: string;
  route: string;
  title: {
    zh: string;
    en: string;
  };
  /** When set, fetch from this URL instead of rsshubBase */
  baseUrl?: string;
}

export interface FeedItem {
  id: string;
  sourceId: string;
  sourceTitle: string;
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  category: string[];
}

const defaultRsshubBase = 'http://124.222.119.248:1200';
const defaultWeweRssBase = 'http://124.222.119.248:14000';

export const rsshubBase = (process.env.NEXT_PUBLIC_RSSHUB_BASE ?? defaultRsshubBase).replace(/\/$/, '');
export const weweRssBase = (process.env.NEXT_PUBLIC_WEWE_RSS_BASE ?? defaultWeweRssBase).replace(/\/$/, '');

export const feedSources: FeedSource[] = [
  {
    id: 'zhihu-hot',
    route: '/zhihu/hot',
    title: {
      zh: '\u77e5\u4e4e\u70ed\u699c',
      en: 'Zhihu Hot',
    },
  },
  {
    id: 'v2ex-hot',
    route: '/v2ex/topics/hot',
    title: {
      zh: 'V2EX \u70ed\u95e8',
      en: 'V2EX Hot',
    },
  },
  {
    id: '36kr-newsflash',
    route: '/36kr/newsflashes',
    title: {
      zh: '36\u6c2a\u5feb\u8baf',
      en: '36Kr Newsflash',
    },
  },
  {
    id: 'wechat-mp',
    route: '/feeds/all.atom?limit=100',
    baseUrl: weweRssBase,
    title: {
      zh: '\u5fae\u4fe1\u516c\u4f17\u53f7',
      en: 'WeChat MP',
    },
  },
];

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const getFirstText = (element: Element, names: string[]) => {
  for (const name of names) {
    const node = element.getElementsByTagName(name)[0];
    const text = node?.textContent?.trim();
    if (text) {
      return text;
    }
  }
  return undefined;
};

const getAtomLink = (entry: Element) => {
  const linkElements = Array.from(entry.getElementsByTagName('link'));

  const alternateLink = linkElements.find((element) => element.getAttribute('rel') === 'alternate');
  if (alternateLink) {
    const href = alternateLink.getAttribute('href')?.trim();
    if (href) {
      return href;
    }
  }

  for (const element of linkElements) {
    const href = element.getAttribute('href')?.trim();
    if (href) {
      return href;
    }
  }

  return getFirstText(entry, ['link', 'id'])?.trim();
};

const normalizeDate = (dateText?: string) => {
  if (!dateText) {
    return undefined;
  }

  const timestamp = Date.parse(dateText);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return new Date(timestamp).toISOString();
};

const parseCategory = (entry: Element, isAtom: boolean) => {
  const categoryNodes = Array.from(entry.getElementsByTagName('category'));

  const categories = categoryNodes
    .map((node) => (isAtom ? node.getAttribute('term') : node.textContent)?.trim())
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(categories));
};

const normalizeLink = (link: string) => {
  try {
    return new URL(link).toString();
  } catch {
    return link;
  }
};

const parseEntry = (
  entry: Element,
  source: FeedSource,
  sourceTitle: string,
  isAtom: boolean
): FeedItem | undefined => {
  const title = getFirstText(entry, ['title']);
  if (!title) {
    return undefined;
  }

  const rawLink = isAtom ? getAtomLink(entry) : getFirstText(entry, ['link', 'guid']);
  if (!rawLink) {
    return undefined;
  }

  const description = getFirstText(entry, ['description', 'content:encoded', 'summary', 'content']);

  const item: FeedItem = {
    id: `${source.id}-${rawLink}`,
    sourceId: source.id,
    sourceTitle,
    title,
    link: normalizeLink(rawLink),
    category: parseCategory(entry, isAtom),
  };

  if (description) {
    item.description = stripHtml(description);
  }

  const pubDate = normalizeDate(getFirstText(entry, ['pubDate', 'published', 'updated', 'dc:date']));
  if (pubDate) {
    item.pubDate = pubDate;
  }

  return item;
};

const parseFeed = (xml: string, source: FeedSource): FeedItem[] => {
  let parser: DOMParser;
  let document: Document;

  if (typeof window === 'undefined') {
    // Node.js environment
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DOMParser } = require('xmldom');
    parser = new DOMParser();
    document = parser.parseFromString(xml, 'text/xml');
  } else {
    // Browser environment
    parser = new DOMParser();
    document = parser.parseFromString(xml, 'text/xml');
  }

  const parserError = document.getElementsByTagName('parsererror')[0];
  if (parserError) {
    throw new Error(`Invalid XML response from ${source.route}`);
  }

  const channel = document.getElementsByTagName('channel')[0];
  const feedRoot = document.getElementsByTagName('feed')[0];
  const sourceTitle =
    getFirstText(channel ?? feedRoot ?? document.documentElement, ['title']) ?? source.title.en;

  const entries = Array.from(document.getElementsByTagName('item'));
  const isAtom = entries.length === 0;
  const nodes = isAtom ? Array.from(document.getElementsByTagName('entry')) : entries;

  const parsedItems: FeedItem[] = [];
  for (const entry of nodes) {
    const item = parseEntry(entry, source, sourceTitle, isAtom);
    if (item) {
      parsedItems.push(item);
    }
  }

  return parsedItems;
};

const sortByDate = (left: FeedItem, right: FeedItem) => {
  const leftTime = left.pubDate ? Date.parse(left.pubDate) : 0;
  const rightTime = right.pubDate ? Date.parse(right.pubDate) : 0;

  if (leftTime === rightTime) {
    return left.title.localeCompare(right.title);
  }

  return rightTime - leftTime;
};

export const fetchFeedStream = async (limit = 300): Promise<FeedItem[]> => {
  const TIMEOUT_MS = 8_000;   // 8s per source
  const MAX_RETRIES = 2;      // retry once on failure
  const RETRY_DELAY_MS = 1_000;

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  /** Fetch a single source with timeout + retry + fallback URL */
  const fetchSource = async (source: FeedSource): Promise<FeedItem[]> => {
    const primaryBase = source.baseUrl ?? rsshubBase;
    // If the configured base differs from the hardcoded IP default, use the default as fallback
    const fallbackBase = source.baseUrl
      ? (source.baseUrl !== defaultWeweRssBase ? defaultWeweRssBase : undefined)
      : (rsshubBase !== defaultRsshubBase ? defaultRsshubBase : undefined);

    const urlsToTry = [
      `${primaryBase}${source.route}`,
      ...(fallbackBase ? [`${fallbackBase}${source.route}`] : []),
    ];

    for (let i = 0; i < urlsToTry.length; i++) {
      const url = urlsToTry[i];
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const xml = await response.text();
        const items = parseFeed(xml, source);
        console.log(`[Feed] ✅ ${source.id}: ${items.length} items (from ${url})`);
        return items;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        if (i < urlsToTry.length - 1) {
          console.warn(`[Feed] ⚠️  ${source.id} failed on ${url} (${reason}), trying fallback...`);
        } else {
          console.error(`[Feed] ❌ ${source.id} failed: ${reason}`);
        }
      } finally {
        clearTimeout(timer);
      }
    }

    return []; // all URLs exhausted → return empty
  };

  // Fetch all sources in parallel
  const results = await Promise.all(feedSources.map(fetchSource));
  const merged = results.flat().sort(sortByDate).slice(0, limit);

  // Deduplicate by link
  const visitedLinks = new Set<string>();
  const uniqueItems: FeedItem[] = [];

  for (const item of merged) {
    if (!visitedLinks.has(item.link)) {
      visitedLinks.add(item.link);
      uniqueItems.push(item);
    }
  }

  console.log(`[Feed] 📊 Total: ${uniqueItems.length} unique items from ${feedSources.length} sources`);
  return uniqueItems;
};
