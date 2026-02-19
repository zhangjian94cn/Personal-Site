import { type FeedPost } from '@/components/FeedItem';
import { fetchFeedStream } from '@/lib/feed';
import FeedContent from './FeedContent';

export const metadata = {
  title: 'Information Flow',
  description: 'Fragmented thoughts, useful links, and daily updates.',
};

export default async function FeedPage() {
  let posts: FeedPost[] = [];

  try {
    const feedItems = await fetchFeedStream();
    posts = feedItems.map(item => ({
      id: item.id,
      content: item.description || item.title,
      date: item.pubDate || new Date().toISOString(),
      type: 'link' as const,
      tags: [item.sourceTitle, ...(item.category || [])],
      link: item.link,
      linkTitle: item.title,
    }));
  } catch (error) {
    console.error('Failed to fetch feed stream at build time:', error);
  }

  return <FeedContent initialPosts={posts} />;
}
