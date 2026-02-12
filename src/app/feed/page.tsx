import { FeedItem, type FeedPost } from '@/components/FeedItem';
import { fetchFeedStream } from '@/lib/feed';
import FeedContent from './FeedContent';
import feedData from '@/../content/feed.yml';

// Force static generation
export const dynamic = 'force-static';

// Revalidate every hour
export const revalidate = 3600;

export const metadata = {
  title: 'Information Flow',
  description: 'Fragmented thoughts, useful links, and daily updates.',
};

export default async function FeedPage() {
  let posts: FeedPost[] = [];
  
  try {
    const feedItems = await fetchFeedStream();
    if (feedItems.length > 0) {
      posts = feedItems.map(item => ({
        id: item.id,
        content: item.description || item.title,
        date: item.pubDate || new Date().toISOString(),
        type: 'link', // Default type for RSS items
        tags: [item.sourceTitle, ...(item.category || [])],
        link: item.link,
        linkTitle: item.title,
      }));
    }
  } catch (error) {
    console.error('Failed to fetch feed stream:', error);
  }

  // Fallback to local data if no posts fetches
  if (posts.length === 0) {
    posts = (feedData as unknown as FeedPost[]).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  return <FeedContent posts={posts} />;
}
