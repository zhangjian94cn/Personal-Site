"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

interface TOCItem {
  value: string;
  url: string;
  depth: number;
}

interface TOCProps {
  toc: TOCItem[];
}

export const TableOfContents = ({ toc }: TOCProps) => {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -80% 0%" }
    );

    toc.forEach((item) => {
      const element = document.getElementById(item.url.slice(1));
      if (element) observer.observe(element);
    });

    return () => {
      toc.forEach((item) => {
        const element = document.getElementById(item.url.slice(1));
        if (element) observer.unobserve(element);
      });
    };
  }, [toc]);

  return (
    <nav className="text-sm">
      <h5 className="mb-4 font-semibold text-gray-900 dark:text-gray-100 flex items-center">
        <span className="mr-2">—</span> CATALOG
      </h5>
      <ul className="space-y-2 border-l border-gray-200 dark:border-gray-700">
        {toc.map((item) => (
          <li
            key={item.url}
            className={clsx(
              "transition-colors duration-200",
              item.depth === 3 && "ml-3"
            )}
          >
            <a
              href={item.url}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(item.url.slice(1));
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" });
                  // Optionally update URL hash without jump
                  window.history.pushState(null, "", item.url);
                }
              }}
              className={clsx(
                "block py-1 pl-4 -ml-px border-l-2 transition-colors duration-200",
                activeId === item.url.slice(1)
                  ? "border-primary-500 text-primary-600 dark:text-primary-400 font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              {item.value}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
