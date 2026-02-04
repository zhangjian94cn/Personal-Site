import { notFound } from "next/navigation";
import Link from "next/link";
import { allBlogs, allAuthors } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer2/hooks";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import PostLayout from "@/layouts/PostLayout";
import { useMDXComponents } from "@/mdx-components";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allBlogs
    .filter((post) => !post.draft)
    .map((post) => ({
      slug: post.slug,
    }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = allBlogs.find((p) => p.slug === slug);

  if (!post) {
    return { title: "文章未找到" };
  }

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.date,
      authors: [siteConfig.author.name],
    },
  };
}

function MDXContent({ code }: { code: string }) {
  const Component = useMDXComponent(code);
  const components = useMDXComponents({});
  return <Component components={components} />;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = allBlogs.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const authorList = post.authors || ["default"];
  const authorDetails = authorList
    .map((author) => allAuthors.find((a) => a.slug === author))
    .filter((author): author is typeof allAuthors[0] => Boolean(author));

  return (
    <PostLayout content={post} authorDetails={authorDetails}>
      <MDXContent code={post.body.code} />
    </PostLayout>
  );
}

