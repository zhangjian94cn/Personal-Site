---
title: "TBB 入门教程"
date: "2022-11-22"
tags: [HPC, TBB, parallel-computing]
draft: false
summary: "Intel oneTBB 入门：介绍 TBB 的优势、安装方法及简单的 parallel_for 使用示例。"
authors: ["default"]
---

## 简介

### oneTBB 的优势

1. oneTBB enables you to specify logical paralleism instead of threads.
2. oneTBB targets threading for performance.
3. oneTBB is compatible with other threading packages.
4. oneTBB emphasizes scalable, data parallel programming.
5. oneTBB relies on generic programming.

### 并行开发中的常见问题

几种在并行开发中常见的问题：

1. Interface correspondence to specification
2. Memory errors
3. Data race
4. Race conditions and deadlocks

其中比较复杂的是：Race conditions 和 deadlocks。可以使用下面的测试方法：

1. **Unit tests**：能力有限但基础重要
2. **Integration tests**：组合多种功能模拟用户场景
3. **Stress testing**：确保很少触发的错误条件也能被捕获

## 安装

```bash
# Clone oneTBB repository
git clone https://github.com/oneapi-src/oneTBB.git
cd oneTBB

# Create binary directory for out-of-source build
mkdir build && cd build

# Configure and build
cmake .. && make -j$(nproc)
sudo make install
```

## 使用示例

```cpp
#include <tbb/tbb.h>
#include <cstdio>

using namespace tbb;

int main()
{
    tick_count t0 = tick_count::now();
    parallel_for(0, 100, 1, [](int i) {
        printf("hello tbb %d \n", i);
    });
    tick_count t1 = tick_count::now();

    printf("use time %f \n", (t1-t0).seconds());

    return 0;
}
```

**CMakeLists.txt**

```cmake
cmake_minimum_required(VERSION 3.1)

project(TEST)
find_package(TBB REQUIRED)
add_executable(TEST_tbb test_tbb.cpp)
target_link_libraries(TEST_tbb TBB::tbb)
```

## 参考

- [oneTBB 官方文档](https://oneapi-src.github.io/oneTBB/)
- [oneTBB 安装指南](https://github.com/oneapi-src/oneTBB/blob/master/INSTALL.md)
- [oneTBB Developer Guide](https://oneapi-src.github.io/oneTBB/main/tbb_userguide/title.html)
