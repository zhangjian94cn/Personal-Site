---
title: "强化学习基础（1）"
date: "2023-03-14"
tags: [deep-learning]
draft: false
summary: "强化学习入门：介绍 Agent、Environment、Policy 等基本概念，以及 DQN、Policy Network 和 Actor-Critic 方法。"
authors: ["default"]
---

## Introduction

**智能体（Agent）**是一个能够感知**环境（Environment）**中的**状态（State）**并采取**动作（Action）**的实体。智能体的目标是在某些时间步中，以最大化的**总回报或奖励（Reward）**完成任务。为了实现这个目标，智能体需要利用之前的经验和当前的信息来选择最佳的动作，这个选择过程根据**策略（Policy）**来执行。

- **Agent**：智能体，目标是获得最大化的回报（reward）
- **Environment**：环境，包括所有的状态、动作、奖励和转移规则
- **Policy**：策略，将当前状态映射到动作的概率分布
- **Action**：动作，智能体在环境中执行的行为
- **Reward**：奖励，表示智能体行为良好或不良的量化反馈值

## Key Concepts

### Reward Function

回报函数定义为从时刻 t 开始的折扣累积奖励：

`R_t = Σ γ^(i-t) × r_i`

其中，R_t 表示在时间 t 的回报值，γ ∈ [0,1] 是折扣因子，表示对未来奖励的重视程度。

### Action-Value Function

动作价值函数用来衡量智能体在某个状态下执行某个动作后遵循某个策略所能获得的期望长期回报：

`Q_π(s, a) = E[R_{t+1} + γ × Q(S_{t+1}, A_{t+1}) | S_t = s, A_t = a]`

最优动作价值函数：

`Q*(s,a) = max_π Q_π(s,a)`

### State-Value Function

状态价值函数衡量智能体在某个状态下遵循某个策略后所能获得的期望长期回报：

`V_π(s) = E[R_{t+1} + γ × V(S_{t+1}) | S_t = s]`

## Deep Q-Network (Value-Based)

Deep Q-Network 用神经网络来近似 Q*(s, a)。DQN 的目标是让神经网络输出的 Q 值尽可能接近 Q* 值，从而在每个状态下选择能够使长期回报最大化的动作。

损失函数：

`L(θ) = E[(r + γ × max_a' Q(s',a';θ⁻) - Q(s,a;θ))²]`

其中：

- θ 是神经网络的参数
- θ⁻ 是目标网络的参数
- D 是经验回放的缓存
- γ 是折扣因子

> DQN 损失函数的设计用到了 Temporal Difference Learning，根据当前状态和动作的价值函数估计和下一个状态的最优动作的价值函数估计来计算 TD 误差。

## Policy Network (Policy-Based)

Policy Network 使用一个神经网络来直接输出给定状态下的动作概率分布。

**优点**：

- 可以处理连续动作空间和高维状态空间
- 可以避免最大化误差的累积

状态价值函数和状态-动作价值函数之间的关系为：

`V_π(s) = Σ π_θ(a|s) × Q_π(s,a)`

即在不同策略概率下 Q 的期望。在 Policy Network 中，我们最大化状态价值函数 V_π(s)。

## Actor-Critic Methods

Actor-Critic Methods 结合了 Value-Based Methods 以及 Policy-Based Methods，不仅获得了两种方法的优点，同时也在一定程度上避免了：

1. **Value-Based 的问题**：高偏差（High bias），不能直接得到动作值输出，难以用于连续动作空间
2. **Policy-Based 的问题**：高方差（High Variance），训练不稳定，策略收敛困难

它包括两个部分：

- **Actor**：策略网络 π_θ(a|s)，输入状态，输出动作
- **Critic**：价值网络，输入状态或状态-动作对，输出价值函数 V_w(s) 或 Q_w(s, a)

## Conclusion

在本文中，我们学习了 RL 基本流程与一些关键性概念，包括回报函数（Reward Function），状态价值函数（State-Value Function）以及动作价值函数（Action-Value Function）。同时，我们还介绍了 Value-Based Methods 以及 Policy-Based Methods，更进一步，Actor-Critic Methods 结合了两种方案，并获得了相对更优的效果。
