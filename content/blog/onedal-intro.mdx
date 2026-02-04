---
title: "oneDAL 入门指南"
date: "2022-12-14"
tags: ["机器学习", "oneDAL", "Intel"]
draft: false
subtitle: "getting started"
summary: "Intel oneDAL 高性能数据分析库入门：介绍 oneDAL 的基本概念、安装方法及示例编译运行。"
authors: ["default"]
---

> 本文是对 oneDAL 的一个简单介绍，主要参考 [onedal 官方文档](https://oneapi-src.github.io/oneDAL/index.html)

## 简介

oneDAL 是一个高性能的数据分析库，其包含了数据分析的所有阶段（preprocessing, transformation, analysis, modeling, validation, and decision making）。oneDAL 支持批量、在线以及分布式的计算模式，主要提供两组 C++ 接口：

- **oneAPI Interfaces**：基于开放的 oneDAL 规范，目前正在积极开发中，可以在各种硬件上工作
- **DAAL Interfaces**：仅限于 CPU 的接口，提供了各种算法的实现

## 安装

### oneAPI

安装 oneDAL 需要的 oneAPI 依赖，包括 intel-basekit intel-hpckit：

```bash
apt-get install -y --no-install-recommends curl ca-certificates gpg-agent software-properties-common

# download the key to system keyring
wget -O- https://apt.repos.intel.com/intel-gpg-keys/GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB | \
  gpg --dearmor | tee /usr/share/keyrings/oneapi-archive-keyring.gpg > /dev/null

# add signed entry to apt sources
echo "deb [signed-by=/usr/share/keyrings/oneapi-archive-keyring.gpg] https://apt.repos.intel.com/oneapi all main" | \
  tee /etc/apt/sources.list.d/oneAPI.list

apt update && apt install intel-basekit intel-hpckit -y

echo "source /opt/intel/oneapi/compiler/latest/env/vars.sh" >> ~/.bashrc
echo "source /opt/intel/oneapi/tbb/latest/env/vars.sh" >> ~/.bashrc
source ~/.bashrc
```

### oneDAL

如果想从源码编译 oneDAL，官网提供了在不同系统环境下的 [安装教程](https://github.com/oneapi-src/oneDAL/blob/master/INSTALL.md)

## 例程

### 编译运行

oneDAL 提供了两种方式编译 example：使用 cmake 或者 make。

#### 使用 make

如果你已经添加了 tbb、icc 等的环境变量，可以直接 make 得到可执行文件：

```bash
source /opt/intel/oneapi/compiler/latest/env/vars.sh
source /opt/intel/oneapi/tbb/latest/env/vars.sh
```

#### 使用 cmake

在使用 cmake 前，先设置 cmake 使用的编译器，在 CMakeLists.txt 下添加：

```cmake
SET(CMAKE_C_COMPILER "icc")
SET(CMAKE_CXX_COMPILER "icpc")
```

使用如下命令进行编译：

```bash
cd <onedal_dir>/__release_lnx/daal/latest/examples/daal/cpp
mkdir build && cd build
cmake .. -DEXAMPLES_LIST=gbt_cls_dense_batch
make -j$(nproc)
```

这样你就会在 `_cmake_results/` 下获得可执行文件。

## 结语

本文带您了解了 oneDAL 的基本概念，并使用一个简单的示例进行编译和运行。然而，真正有趣的部分在于 oneDAL 的内部实现技巧和思想，敬请期待后续内容。
