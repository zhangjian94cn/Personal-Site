'use client';

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function PortfolioPage() {
  const { t, lang } = useLanguage();

  const projects = [
    {
      title: lang === 'zh' ? "Text2SQL 大模型微调" : "Text2SQL LLM Fine-tuning",
      description: lang === 'zh' 
        ? "基于 LoRA 微调 Qwen-7B 实现自然语言转 SQL，准确率达 98.56%" 
        : "Fine-tuned Qwen-7B with LoRA for NL-to-SQL task, achieving 98.56% accuracy.",
      tags: ["LLM", "Fine-tuning", "LoRA"],
      status: "completed",
    },
    {
      title: lang === 'zh' ? "数智助手 RAG 系统" : "AI Assistant RAG System",
      description: lang === 'zh' 
        ? "企业级检索增强生成系统，支持多轮对话和知识库管理" 
        : "Enterprise RAG system supporting multi-turn dialogue and knowledge base management.",
      tags: ["RAG", "LangChain", "Vector DB"],
      status: "completed",
    },
    {
      title: lang === 'zh' ? "高精度图像分割" : "High-Precision Image Segmentation",
      description: lang === 'zh' 
        ? "基于深度学习的图像语义分割算法优化" 
        : "Optimization of semantic segmentation algorithms based on deep learning.",
      tags: ["CV", "Segmentation", "PyTorch"],
      status: "completed",
    },
  ];

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pb-8 pt-6 md:space-y-5">
        <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
          {t('portfolio.title')}
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          {t('portfolio.subtitle')}
        </p>
      </div>

      {/* Projects Grid */}
      <div className="py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.title}
              className="group rounded-2xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 transition-all hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-lg"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                    {project.status === "completed" 
                      ? t('portfolio.status.completed') 
                      : t('portfolio.status.inProgress')}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                  {project.title}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('portfolio.cta')}
          </p>
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-full bg-primary-500 hover:bg-primary-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
          >
            {t('portfolio.contact')} →
          </Link>
        </div>
      </div>
    </div>
  );
}
