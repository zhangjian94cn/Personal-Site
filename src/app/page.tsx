import Link from "next/link";
import { allBlogs } from "contentlayer/generated";
import { compareDesc } from "date-fns";
import { Hero } from "@/components/ui/Hero";
import { PostCard } from "@/components/ui/PostCard";

export default function Home() {
  const posts = allBlogs
    .filter((post) => !post.draft)
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
    .slice(0, 3); // Display only top 3 latest posts

  return (
    <>
      <Hero />
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            Latest Insights
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600 dark:text-gray-400">
            Explore my latest thoughts on AI, technology, and life.
          </p>
        </div>
        
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-gray-200 pt-10 dark:border-gray-700 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        <div className="mt-16 text-center">
           <Link
              href="/blog"
              className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-primary-600 shadow-sm ring-1 ring-inset ring-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:ring-primary-400 dark:hover:bg-primary-900/20"
            >
              View All Posts <span aria-hidden="true">→</span>
            </Link>
        </div>
      </div>
    </>
  );
}
