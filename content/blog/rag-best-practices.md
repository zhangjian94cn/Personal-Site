---
title: "RAG 系统最佳实践"
date: "2026-01-20"
tags: ["RAG", "LangChain", "Vector DB", "LLM"]
draft: false
summary: "总结企业级 RAG 系统开发中的经验教训，包括文档分块、向量检索和回答生成优化。"
authors: ["default"]
---

## 什么是 RAG

RAG (Retrieval-Augmented Generation) 是一种结合检索和生成的技术架构：

1. **检索阶段**：从知识库中找到与问题相关的文档片段
2. **生成阶段**：将检索结果作为上下文，让 LLM 生成回答

## 核心组件

### 文档分块策略

分块质量直接影响检索效果：

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", "。", "！", "？"]
)
```

**经验教训**：

- 中文场景下，按句子分割比按字符更有效
- overlap 设置为 chunk_size 的 10% 左右
- 保留文档结构信息（标题、层级）

### 向量存储选择

| 方案     | 优势           | 适用场景         |
| -------- | -------------- | ---------------- |
| Chroma   | 轻量、易用     | 本地开发、小规模 |
| Milvus   | 高性能、分布式 | 生产环境、大规模 |
| Pinecone | 全托管         | 快速上线、无运维 |

### 检索优化

混合检索效果最佳：

```python
from langchain.retrievers import EnsembleRetriever

# 语义检索 + 关键词检索
ensemble = EnsembleRetriever(
    retrievers=[vector_retriever, bm25_retriever],
    weights=[0.7, 0.3]
)
```

## 生产实践

### 评估指标

- **召回率**: 相关文档是否被检索到
- **准确率**: 回答是否正确
- **幻觉率**: 是否编造不存在的信息

### 常见问题

1. **检索到但答案不对** → 优化 Prompt
2. **相关文档检索不到** → 调整分块策略
3. **回答太啰嗦** → 限制输出长度

## 总结

RAG 不是银弹，需要根据业务场景持续优化。关键是建立完善的评估体系。
