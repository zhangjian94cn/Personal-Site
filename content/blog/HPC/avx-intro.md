---
title: "AVX 指令入门"
date: "2022-11-19"
tags: ["HPC", "AVX", "SIMD", "性能优化"]
draft: false
summary: "介绍 SIMD 向量化指令的基础概念，包括自动向量化与手动向量化的实现方式和性能对比。"
authors: ["default"]
---

## 简介

SIMD（Single Instruction Multiple Data）是指一条指令能够操作多个数据，是对 CPU 指令的扩展，主要用来进行小数据的并行操作。

> Intel 最初支持 SIMD 的指令集是 1996 年集成在 Pentium 里的 MMX（Multi-Media Extension，多媒体扩展），它的主要目标是为了支持 MPEG 视频解码。Intel 在 1999 年 Pentium3 中推出了 SSE（Streaming SIMD Extensions，流式SIMD扩展），是继 MMX 的扩展指令集，主要用于 3D 图形计算。Intel 在 2008 年 3 月份提出了 AVX 指令集（Advanced Vector Extension，高级向量扩展），它是 SSE 延伸架构，将 SSE 中的 16 个 128 位 XMM 寄存器扩展为 16 个 256 位 YMM 寄存器，增加了一倍的运算效率。 (CSAPP)

## 实现

使用 AVX 指令加速代码主要有两种方式：

**自动向量化**：intel C++ 编译器进行自动向量化，需要使用 `-xhost` 编译选项。在 gcc 编译器中的对应选项为 `-march=native`。开启该选项后，编译器会自动根据 CPU 支持的指令集进行向量化。

**手动向量化**：主要使用 [Intel Intrinsics](https://www.intel.com/content/www/us/en/docs/intrinsics-guide/index.html) 中的指令进行代码程序的编写。

### 自动向量化

对于代码的指定部分进行向量化可以加上编译宏：

```cpp
void auto_vec(float* a, float* b, int* idx) {
    #pragma ivdep
    #pragma vector always
    for (int j = 0; j < 1024; ++ j) {
        a[idx[j]] += b[j];
    }
}
```

**速度比较**：当使用 `icc -O3 -xhost` 的编译指令时，运行 100m 次，相较于 `g++ -O3`，向量化的编译方式能够获得 2 倍左右的速度提升。

观察输出文件的汇编代码，可以看到向量化指令的使用：

```asm
402ee0:       c4 81 7c 10 14 88       vmovups (%r8,%r9,4),%ymm2
402ee6:       c4 81 7c 10 64 88 20    vmovups 0x20(%r8,%r9,4),%ymm4
402eed:       c5 fc 57 c0             vxorps %ymm0,%ymm0,%ymm0
402ef1:       62 f1 7d 08 74 c8       vpcmpeqb %xmm0,%xmm0,%k1
402ef7:       c5 f4 57 c9             vxorps %ymm1,%ymm1,%ymm1
402efb:       62 f2 7d 29 92 04 97    vgatherdps (%rdi,%ymm2,4),%ymm0
```

### 手动向量化

下面是相同代码的手动向量化实现：

```cpp
void core_intrinsics(std::vector<float>& a, std::vector<float>& b, int* idx) {
    for (int j = 0; j < 1024; j += 16) {
        __m512i _idx = _mm512_load_epi32(idx + j);
        __m512 _b512 = _mm512_load_ps(b.data() + j);
        __m512 _a512 = _mm512_i32gather_ps(_idx, a.data(), 4);

        __m512 _res = _mm512_add_ps(_a512, _b512);
        _mm512_i32scatter_ps(a.data(), _idx, _res, 4);
    }
}
```

有兴趣的可以自己尝试，比较两种方法的速度以及背后的原因。

## 结论

通过上面的简单实验，我们初步认知了向量化的两种实现方式。但是如何能更好地利用 AVX 指令的优势，需要考虑具体的代码。影响性能的核心因素是 memory bound 还是 compute bound，代码程序是否能实现指令上的并行，代码的关键路径是什么等等都是我们需要考虑的。
