---
title: "CUDA 性能优化技巧"
date: "2026-01-15"
tags: [CUDA, HPC, optimization, GPU]
draft: false
summary: "深入探讨 CUDA 编程中的性能优化策略，包括内存访问模式、线程组织和性能分析工具。"
authors: ["default"]
---

## 为什么需要 CUDA 优化

GPU 并行计算能力强大，但要充分发挥性能需要了解硬件特性。优化得当可以获得 10-100 倍加速。

## 核心优化策略

### 1. 内存合并访问

GPU 内存以 128 字节为单位读取，相邻线程访问相邻内存效率最高：

```cpp
// ❌ 慢：跨步访问
__global__ void bad_kernel(float* data, int stride) {
    int idx = threadIdx.x * stride;
    float val = data[idx];  // 非合并访问
}

// ✅ 快：连续访问
__global__ void good_kernel(float* data) {
    int idx = threadIdx.x;
    float val = data[idx];  // 合并访问
}
```

### 2. 共享内存使用

共享内存速度比全局内存快 100 倍：

```cpp
__global__ void matrix_mul(float* A, float* B, float* C) {
    __shared__ float tile_A[16][16];
    __shared__ float tile_B[16][16];

    // 分块加载到共享内存
    tile_A[ty][tx] = A[row * N + tx];
    tile_B[ty][tx] = B[ty * N + col];
    __syncthreads();

    // 在共享内存中计算
    for (int k = 0; k < 16; k++) {
        sum += tile_A[ty][k] * tile_B[k][tx];
    }
}
```

### 3. 避免分支分歧

同一个 warp 内的线程应执行相同指令：

```cpp
// ❌ 分支分歧
if (threadIdx.x % 2 == 0) {
    // 一半线程执行这里
} else {
    // 另一半线程执行这里
}

// ✅ 无分歧
int offset = (threadIdx.x % 2) * stride;
data[threadIdx.x + offset] = value;
```

## 性能分析工具

### Nsight Compute

```bash
ncu --target-processes all ./my_cuda_app
```

关注指标：

- **SM 利用率**: 应 > 80%
- **内存带宽利用率**: 应 > 60%
- **Occupancy**: 活跃 warp 比例

### nvprof (旧版)

```bash
nvprof --print-gpu-trace ./my_cuda_app
```

## 性能对比

优化前后的矩阵乘法性能：

| 版本        | 耗时   | 加速比 |
| ----------- | ------ | ------ |
| CPU 基线    | 1200ms | 1x     |
| 朴素 CUDA   | 45ms   | 27x    |
| 共享内存    | 8ms    | 150x   |
| Tensor Core | 2ms    | 600x   |

## 总结

CUDA 优化需要理解硬件架构。善用性能分析工具，找到瓶颈再针对性优化。
