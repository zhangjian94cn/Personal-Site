// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import readingTime from "reading-time";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrismPlus from "rehype-prism-plus";
import rehypeKatex from "rehype-katex";
import { extractTocHeadings } from "pliny/mdx-plugins/index.js";
var computedFields = {
  readingTime: {
    type: "json",
    resolve: (doc) => readingTime(doc.body.raw)
  },
  slug: {
    type: "string",
    resolve: (doc) => doc._raw.sourceFileName.replace(/\.md$/, "")
  },
  path: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath
  },
  toc: {
    type: "json",
    resolve: (doc) => extractTocHeadings(doc.body.raw)
  }
};
var Blog = defineDocumentType(() => ({
  name: "Blog",
  filePathPattern: "blog/**/*.md",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    tags: { type: "list", of: { type: "string" }, default: [] },
    lastmod: { type: "date" },
    draft: { type: "boolean" },
    summary: { type: "string" },
    images: { type: "json" },
    authors: { type: "list", of: { type: "string" } },
    layout: { type: "string" },
    subtitle: { type: "string" }
  },
  computedFields: {
    ...computedFields,
    structuredData: {
      type: "json",
      resolve: (doc) => ({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: doc.title,
        datePublished: doc.date,
        dateModified: doc.lastmod || doc.date,
        description: doc.summary,
        url: `https://zhangjian94cn.github.io/blog/${doc._raw.sourceFileName.replace(/\.md$/, "")}`
      })
    }
  }
}));
var Authors = defineDocumentType(() => ({
  name: "Authors",
  filePathPattern: "authors/**/*.md",
  contentType: "mdx",
  fields: {
    name: { type: "string", required: true },
    avatar: { type: "string" },
    occupation: { type: "string" },
    company: { type: "string" },
    email: { type: "string" },
    twitter: { type: "string" },
    linkedin: { type: "string" },
    github: { type: "string" }
  },
  computedFields
}));
var contentlayer_config_default = makeSource({
  contentDirPath: "content",
  documentTypes: [Blog, Authors],
  mdx: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "prepend",
          headingProperties: {
            className: ["content-header"]
          }
        }
      ],
      [rehypePrismPlus, { defaultLanguage: "js", ignoreMissing: true }],
      rehypeKatex
    ]
  }
});
export {
  Authors,
  Blog,
  contentlayer_config_default as default
};
//# sourceMappingURL=compiled-contentlayer-config-EOVEU6KB.mjs.map
