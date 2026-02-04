import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Custom heading styles
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-gray-100 mt-10 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100 mt-8 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold leading-snug text-gray-900 dark:text-gray-100 mt-6 mb-3">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">{children}</h4>
    ),
    // Custom paragraph
    p: ({ children }) => (
      <p className="text-base leading-7 text-gray-700 dark:text-gray-300 my-4">{children}</p>
    ),
    // Custom code blocks - matching original Jekyll style
    pre: ({ children }) => (
      <pre className="bg-[#282c34] text-gray-100 rounded-md p-4 overflow-x-auto my-6 text-sm leading-relaxed font-mono shadow-md">
        {children}
      </pre>
    ),
    // Inline code - subtle background
    code: ({ children, className }) => {
      // If it's inside a pre (code block), don't add extra styling
      if (className?.includes('language-')) {
        return <code className={className}>{children}</code>;
      }
      return (
        <code className="bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    },
    // Custom links - matching original blue link style
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 hover:underline transition-colors"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    // Custom blockquote - matching original Jekyll style with left border
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary-500 bg-gray-50 dark:bg-gray-800/50 pl-4 pr-4 py-3 my-6 text-gray-600 dark:text-gray-400 italic rounded-r-md">
        {children}
      </blockquote>
    ),
    // Custom lists
    ul: ({ children }) => (
      <ul className="list-disc pl-6 space-y-2 my-4 text-gray-700 dark:text-gray-300">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 space-y-2 my-4 text-gray-700 dark:text-gray-300">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-base leading-7 text-gray-700 dark:text-gray-300">{children}</li>
    ),
    // Strong and emphasis
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic">{children}</em>
    ),
    // Horizontal rule
    hr: () => (
      <hr className="my-8 border-gray-200 dark:border-gray-700" />
    ),
    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr>{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">{children}</th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{children}</td>
    ),
    // Images
    img: ({ src, alt }) => (
      <img src={src} alt={alt} className="rounded-lg shadow-md my-6 max-w-full h-auto" />
    ),
    ...components,
  };
}
