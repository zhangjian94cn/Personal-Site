import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const contentDirectory = path.join(process.cwd(), 'content/blog');

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  author?: string;
  tags?: string[];
  summary?: string;
  readingTime: string;
  draft?: boolean;
}

export interface Post extends PostMeta {
  content: string;
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(contentDirectory)) {
    return [];
  }

  const files = fs.readdirSync(contentDirectory);
  
  const posts = files
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => {
      const filePath = path.join(contentDirectory, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);
      const slug = file.replace(/\.(md|mdx)$/, '');
      
      return {
        slug,
        title: data.title || slug,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        author: data.author,
        tags: data.tags || [],
        summary: data.summary || data.description || '',
        readingTime: readingTime(content).text,
        draft: data.draft || false,
      };
    })
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPostBySlug(slug: string): Post | null {
  const mdPath = path.join(contentDirectory, `${slug}.md`);
  const mdxPath = path.join(contentDirectory, `${slug}.mdx`);
  
  let filePath = '';
  if (fs.existsSync(mdxPath)) {
    filePath = mdxPath;
  } else if (fs.existsSync(mdPath)) {
    filePath = mdPath;
  } else {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title || slug,
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    author: data.author,
    tags: data.tags || [],
    summary: data.summary || data.description || '',
    readingTime: readingTime(content).text,
    draft: data.draft || false,
    content,
  };
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  
  posts.forEach((post) => {
    post.tags?.forEach((tag) => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((post) => post.tags?.includes(tag));
}
