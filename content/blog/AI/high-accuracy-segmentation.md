---
title: "高精度图像分割技术回顾"
date: "2023-11-06"
tags: [deep-learning]
draft: false
summary: "回顾高精度图像分割算法发展：从 BASNet 到 U2Net，再到 DIS。探讨 Residual Refine Module 及多尺度融合技术。"
authors: ["default"]
---

## 前言

最近回顾了一下之前使用过的高精度图像分割算法，从 BASNet，到 U2Net，再到 2022 年的 DIS。高精度的图像分割技术在计算机视觉领域具有着极为重要的应用。通过准确地分离图像中的不同对象、区域和特征，我们可以实现：

1. **更安全的自动驾驶**：通过将道路、车道线、交通标志和行人精确分离，以帮助车辆导航
2. **更精确的医疗诊断**：通过将自动化的分割人体器官，可以实现高精度自动化的人体手术
3. **更佳的社交应用体验**：通过高精度的分割，我们可以实现各种创意效果，如背景虚化、景深效果和图像合成等等

## BASNet

这篇论文的贡献主要有两个：

- 提出了一个基于残差的 Refine 模块（Residual Refine Module）
- 使用了多层级的 loss，分别是 pixel，patch 和 map 级别的 BCE，SSIM，IOU loss

### predict-refine 网络架构

BASNet 是一个类似 U-Net 的 encoder-decoder 的网络架构，其和传统分割网络的区别在于：增加了一个 refine 模块。refine 模块的输入是：encoder 的特征，其学习的目标是 coarse predict 网络与 ground truth 的残差。

### 多层级的混合 loss

- **BCE loss**：这是一个针对像素进行二分类的 loss
- **Structural SIMilarity (SSIM)**：结构相似性的度量，用于衡量两张图的相似度，特别关注边缘效果
- **IOU**：对整个图像的分割正确率的一种度量

## U2Net

U2Net 的主要贡献有两个：

- 提出了一个能融合多尺度信息的 RSU（ReSidual U-blocks）结构
- 基于 RSU 结构的新的网络架构

### ReSidual U-blocks

RSU 的结构简单来说就是：残差的跨接维度是以一个 UNet 为单位的。换句话说 ResNet 结构中的 weight layer 被替换成了一个 UNet，这样做的优势在于 U-block 的输出可以认为是带有多尺度信息的，从而增强了模型的能力。

### 网络架构

整体的网络架构是在原来的 RSU 模块的基础上再套一个 UNet 的结构，这也是为什么叫 U² 的原因。对于每一层的特征输出，最终都会被 concate 到一起，得到一个融合之后的结果。

需要注意的是，在 loss 计算时，不仅考虑了最终的 S_fuse，其每一个特征层的输出都会被加入到 loss 计算中去。

## Highly Accurate Dichotomous Image Segmentation（DIS）

这篇工作很大的贡献在于：提供了一个高精度的分割数据集。尤其是对于物体细节这块，标注的非常精准，此类数据成本往往很高，能够公开出来是非常难得的。

相对于 U2Net，效果上也有了很大的提升。除了数据集的贡献之外，这篇工作提出了：

- 一种新的基于中间监督的基线 IS-Net，它通过强制高维特征的直接同步来减少过拟合
- 人工矫正量（HCE）指标

### IS-Net 网络架构

IS-Net 的网络架构基本上是沿用了 U2Net 的结构，区别在于其对多尺度下的特征进行直接的监督。如何做到这一点呢？其将训练分成了两个阶段：

1. 第一阶段基于 ground truth 训练一个编码器，其包含了多尺度下对应的**特征 ground truth**
2. 第二阶段利用这些特征 ground truth 去训练原来的 U2Net 结构

需要注意的是，在推理过程中，我们只需要主干部分，特征监督模块只参与训练。

## 结语

通过本文，我们简单回顾了高精度图像分割相关工作，其在计算机视觉领域具有着广泛的应用前景。这些算法的不断发展和改进使我们能够更准确地分离图像中的不同对象、区域和特征。

## 参考

- [BASNet](https://github.com/xuebinqin/BASNet)
- [U-2-Net](https://github.com/xuebinqin/U-2-Net)
- [DIS](https://github.com/xuebinqin/DIS)
