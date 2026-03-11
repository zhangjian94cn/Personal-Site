---
title: "Let's build GPT: from scratch, in code, spelled out (1)"
date: "2023-01-20"
tags: ["LLM", "Deep-Learning"]
draft: false
summary: "a shocking turn of events a leaf has fallen from a treat in the local park Witnesses report that the leaf which was previously attached to a branch of"
authors: ["default"]
---

最近Karpathy写的这篇关于gpt的教程通俗易懂，引起了非常大的反响。这里，我参考了这篇教程进行了简单翻译、总结。

## 简介

### ChatGPT, Transformers, nanoGPT, Shakespeare

ChatGPT是一个革命性的语言模型，在人工智能界引起了轰动，它是一个基于文本让你和AI互动的系统。例如，可以要求ChatGPT给我们写一首俳句，说明人们了解AI的重要性以及如何利用它来改善世界并使其更加繁荣。ChatGPT是一个概率性系统，因此对于任何一个提示（prompt），它都可以给出多个答案。

一个例子，请写一篇关于树叶从树上掉下来的突发新闻：

> a shocking turn of events a leaf has fallen from a treat in the local park Witnesses report that the leaf which was previously attached to a branch of a tree detached itself and fell to the ground very dramatic

你可以看到，这是一个相当了不起的系统，它模拟了单词，字符或标记的序列，它知道英语中的单词是如何相互关联的。给它一个序列的开头，ChatGPT完成了序列，在这个意义上它是一个语言模型。



接下来，我们将研究ChatGPT背后的技术原理。那么，在背后模拟单词序列的神经网络是什么呢？其来自于一篇名为[《Attention Is All You Need》](https://proceedings.neurips.cc/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf)的论文，发表于2017年。这是一篇具有里程碑意义的论文，提出了Transformer架构。GPT是通用预训练Transformer的缩写（[Generative Pre-Training](https://s3-us-west-2.amazonaws.com/openai-assets/research-covers/language-unsupervised/language_understanding_paper.pdf)）。在2017年的这篇论文中，Transformer架构是为机器翻译而设计的，但实际上它在人工智能领域取得了巨大成功，成为了许多应用的核心技术，包括ChatGPT。

现在，让我们来建立一个类似于ChatGPT的系统（我们无法直接复现ChatGPT，这是一个非常严肃的生产级系统，它在大量的互联网上训练过，并经过了大量的预训练和微调，因此非常复杂）。我们重点关注的是：**如何训练一个基于Transformer的语言模型**。在这里，我们将实现一个**字符级的语言模型**。这非常的有教育意义，它可以帮助我们了解这些系统的工作原理，同时也不需要训练整个互联网，只需要一个较小的数据集。我们使用了一个小数据集，名为Tiny Shakespeare。它是所有莎士比亚作品的结合体，整个文件大约1MB。我们将使用这个数据集来训练Transformer，让它能够产生类似于莎士比亚作品的字符序列。

在训练完成后，我们可以生成无限量的莎士比亚作品，虽然它是假的，但看起来很像莎士比亚的作品。这是通过Transformer实现的，它的工作方式类似于ChatGPT，不同的是它是逐个字符进行预测的，而ChatGPT是**逐个词**级别的。Karpathy已经写好了训练这些Transformer的所有代码，并且可以在的GitHub上找到名为Nano GPT的repo。这是一个很好的学习资源，可以帮助你了解如何训练这种类型的模型。

## 代码

现在我们从零开始构建Transformer模型。我们将在Tiny Shakespeare数据集上进行训练，并看看如何生成无限的莎士比亚作品。重要的是：这个过程可以应用于任意的文本数据集。你需要掌握Python编程，并对微积分和统计学有基本的了解。[google colab](https://colab.research.google.com/drive/1JMLa53HDuA-i7ZBmqV7ZnA3c_fvtXnx-?usp=sharing#scrollTo=wJpXpmjEYC_T)

### baseline language modeling, code setup

#### reading and exploring the data

首先下载数据集：

```bash
# We always start with a dataset to train on. Let's download the tiny shakespeare dataset
!wget https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt
```

读取数据，并查看
```python
# read it in to inspect it
with open('input.txt', 'r', encoding='utf-8') as f:
    text = f.read()

print("length of dataset in characters: ", len(text))

# let's look at the first 1000 characters
print(text[:1000])
```

提取本文中的所有字符
```python
# here are all the unique characters that occur in this text
chars = sorted(list(set(text)))
vocab_size = len(chars)
print(''.join(chars))
print(vocab_size)
```

输出
```bash
!$&',-.3:;?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
65
```

#### tokenization, train/val split

将原始的文本转化为整数序列的过程，称为tokenization。这里实现了一种简单的基于字符的tokenization：遍历所有的字符，并建立一个字符到整数的映射表和反向映射表（encoder和decoder）。这样就可以将任意字符串编码为整数序列，也可以将其解码回原来的字符串。除此以外，也可以使用[google/sentencepiece](https://github.com/google/sentencepiece)，[openai/tiktoken](https://github.com/openai/tiktoken)...


```python
# create a mapping from characters to integers
stoi = { ch:i for i,ch in enumerate(chars) }
itos = { i:ch for i,ch in enumerate(chars) }
encode = lambda s: [stoi[c] for c in s] # encoder: take a string, output a list of integers
decode = lambda l: ''.join([itos[i] for i in l]) # decoder: take a list of integers, output a string

print(encode("hii there"))
print(decode(encode("hii there")))
```

在下面这段代码中，我们使用tensor存储数据，并且划分训练集与测试集
```python
# let's now encode the entire text dataset and store it into a torch.Tensor
import torch # we use PyTorch: https://pytorch.org
data = torch.tensor(encode(text), dtype=torch.long)
print(data.shape, data.dtype)
print(data[:1000]) # the 1000 characters we looked at earier will to the GPT look like this

# Let's now split up the data into train and validation sets
n = int(0.9*len(data)) # first 90% will be train, rest val
train_data = data[:n]
val_data = data[n:]
```

#### data loader: batches of chunks of data

由于我们不可能一次性将文本全部输入到Transformer中，这样计算代价太高。因此，当我们在大量数据集上训练Transformer时，只使用数据集的小块。这些小块都有一定长度，最大长度是block size。在这里，我们设置block size的值为8。因此，最小的训练单元包含9位数据，前8位是模型输入$x$，后8位则是标签值$y$

```python
block_size = 8
train_data[:block_size+1]
```

在这9位数据中，可以获得8个训练单元，我们将这8个训练单元打印出来

```python
x = train_data[:block_size]
y = train_data[1:block_size+1]
for t in range(block_size):
    context = x[:t+1]
    target = y[t]
    print(f"when input is {context} the target: {target}")
```

打印结果如下：

```bash
when input is tensor([18]) the target: 47
when input is tensor([18, 47]) the target: 56
when input is tensor([18, 47, 56]) the target: 57
when input is tensor([18, 47, 56, 57]) the target: 58
when input is tensor([18, 47, 56, 57, 58]) the target: 1
when input is tensor([18, 47, 56, 57, 58,  1]) the target: 15
when input is tensor([18, 47, 56, 57, 58,  1, 15]) the target: 47
when input is tensor([18, 47, 56, 57, 58,  1, 15, 47]) the target: 58
```

使用存在长度限制的$(input, target)$来训练transformer，既可以提升效率，也能让transformer在推理时适应不同的文字输入长度，甚至可以只使用1个字符作为输入进行预测。 我们还会设置batch size，这样可以同时处理多个数据。而batch的获取， 会随机的从训练数据中进行采样。


```python
torch.manual_seed(1337)
batch_size = 4 # how many independent sequences will we process in parallel?
block_size = 8 # what is the maximum context length for predictions?

def get_batch(split):
    # generate a small batch of data of inputs x and targets y
    data = train_data if split == 'train' else val_data
    ix = torch.randint(len(data) - block_size, (batch_size,))
    x = torch.stack([data[i:i+block_size] for i in ix])
    y = torch.stack([data[i+1:i+block_size+1] for i in ix])
    return x, y
```

我们可以将采样得到的数据打印出来

```python
xb, yb = get_batch('train')
print('inputs:')
print(xb.shape)
print(xb)
print('targets:')
print(yb.shape)
print(yb)

print('----')

for b in range(batch_size): # batch dimension
    for t in range(block_size): # time dimension
        context = xb[b, :t+1]
        target = yb[b,t]
        print(f"when input is {context.tolist()} the target: {target}")
```

打印结果：

```
inputs:
torch.Size([4, 8])
tensor([[24, 43, 58,  5, 57,  1, 46, 43],
        [44, 53, 56,  1, 58, 46, 39, 58],
        [52, 58,  1, 58, 46, 39, 58,  1],
        [25, 17, 27, 10,  0, 21,  1, 54]])
targets:
torch.Size([4, 8])
tensor([[43, 58,  5, 57,  1, 46, 43, 39],
        [53, 56,  1, 58, 46, 39, 58,  1],
        [58,  1, 58, 46, 39, 58,  1, 46],
        [17, 27, 10,  0, 21,  1, 54, 39]])
----
when input is [24] the target: 43
when input is [24, 43] the target: 58
···
```

#### simplest baseline: bigram language model, loss, generation

让我们从一个最简单的神经网络语言模型开始，即*bigram language model*。在`__init__`中，我们使用nn.Embedding定义了token_embedding_table，其是一个大小为vocab_size*vocab_size的矩阵，当输入一个字符的idx：`self.token_embedding_table(idx)`，便会从这个矩阵中得到对应的一行向量，例如我们输入24，就会得到第24行的数据。

在训练过程中，forward函数中的`idx`，其形状是`batch_size*time`，经过embedding，我们会得到形状为`batch_size*time*channel`的张量logits，其为网络输出的原始预测值，是未经过归一化的。继续看forward函数，当存在targets（为训练过程）时，首先将logits、targets进行reshape，再使用交叉熵函数计算loss。

在训练完成后，可以使用训练好的模型生成连续的字符，也就是函数`generate`所做的事。首先，最大的字符生成长度为`max_new_tokens`，循环开始，向forward函数中输入当前的idx，得到logits，取时间维度上的最后一维（字符串的最后一个字符），经过softmax归一化得到概率，再根据概率得到下一个字符的idx，最后将当前的预测结果idx_next与之前的idx进行合并，这样便可以得到当前的最新字符序列。

```python
import torch
import torch.nn as nn
from torch.nn import functional as F
torch.manual_seed(1337)

class BigramLanguageModel(nn.Module):

    def __init__(self, vocab_size):
        super().__init__()
        # each token directly reads off the logits for the next token from a lookup table
        self.token_embedding_table = nn.Embedding(vocab_size, vocab_size)

    def forward(self, idx, targets=None):

        # idx and targets are both (B,T) tensor of integers
        logits = self.token_embedding_table(idx) # (B,T,C)
        
        if targets is None:
            loss = None
        else:
            B, T, C = logits.shape
            logits = logits.view(B*T, C)
            targets = targets.view(B*T)
            loss = F.cross_entropy(logits, targets)

        return logits, loss
    
    def generate(self, idx, max_new_tokens):
        # idx is (B, T) array of indices in the current context
        for _ in range(max_new_tokens):
            # get the predictions
            logits, loss = self(idx)
            # focus only on the last time step
            logits = logits[:, -1, :] # becomes (B, C)
            # apply softmax to get probabilities
            probs = F.softmax(logits, dim=-1) # (B, C)
            # sample from the distribution
            idx_next = torch.multinomial(probs, num_samples=1) # (B, 1)
            # append sampled index to the running sequence
            idx = torch.cat((idx, idx_next), dim=1) # (B, T+1)
        return idx

```

基于这个模型，我们可以生成一个长度为100的字符串序列

```python
m = BigramLanguageModel(vocab_size)
logits, loss = m(xb, yb)
print(logits.shape)
print(loss)

print(decode(m.generate(idx = torch.zeros((1, 1), dtype=torch.long), max_new_tokens=100)[0].tolist()))
```
打印结果如下：

```
torch.Size([32, 65])
tensor(4.8786, grad_fn=<NllLossBackward0>)

SKIcLT;AcELMoTbvZv C?nq-QE33:CJqkOKH-q;:la!oiywkHjgChzbQ?u!3bLIgwevmyFJGUGp
wnYWmnxKWWev-tDqXErVKLgJ
```

#### training the bigram model

接下来，让我们开始训练模型，首先加入AdamW优化器，然后设置100次循环迭代，一次循环的步骤如下：
1. 获取batch数据
2. 模型预测得到loss
3. 清空优化器之前的梯度信息
4. loss反传得到梯度
5. optimizer基于梯度信息更新模型参数

```python
# create a PyTorch optimizer
optimizer = torch.optim.AdamW(m.parameters(), lr=1e-3)

batch_size = 32
for steps in range(100): # increase number of steps for good results... 
    
    # sample a batch of data
    xb, yb = get_batch('train')

    # evaluate the loss
    logits, loss = m(xb, yb)
    optimizer.zero_grad(set_to_none=True)
    loss.backward()
    optimizer.step()

print(loss.item())
```

最终这个模型的训练效果并不好，迭代100次之后，loss为4.66，打印预测的字符序列：

```python
print(decode(m.generate(idx = torch.zeros((1, 1), dtype=torch.long), max_new_tokens=500)[0].tolist()))
```

打印结果：

```
oTo.JUZ!!zqe!
xBP qbs$Gy'AcOmrLwwt
p$x;Seh-onQbfM?OjKbn'NwUAW -Np3fkz$FVwAUEa-wzWC -wQo-R!v -Mj?,SPiTyZ;o-opr$mOiPJEYD-CfigkzD3p3?zvS;ADz;.y?o,ivCuC'zqHxcVT cHA
rT'Fd,SBMZyOslg!NXeF$sBe,juUzLq?w-wzP-h
ERjjxlgJzPbHxf$ q,q,KCDCU fqBOQT
SV&CW:xSVwZv'DG'NSPypDhKStKzC -$hslxIVzoivnp ,ethA:NCCGoi
tN!ljjP3fwJMwNelgUzzPGJlgihJ!d?q.d
pSPYgCuCJrIFtb
jQXg
pA.P LP,SPJi
DBcuBM:CixjJ$Jzkq,OLf3KLQLMGph$O 3DfiPHnXKuHMlyjxEiyZib3FaHV-oJa!zoc'XSP :CKGUhd?lgCOF$;;DTHZMlvvcmZAm;:iv'MMgO&Ywbc;BLCUd&vZINLIzkuTGZa
D.?
```

## 结论

至此，我们搭建了一个最简单的语言模型，虽然目前的结果并不好，但是接下来的文章中，我们将引入self attention以及transformer，这将大大提升模型的效果，敬请期待:)

## 参考

[video](https://www.youtube.com/watch?v=kCc8FmEb1nY&list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ&index=8)，[Google colab ](https://colab.research.google.com/drive/1JMLa53HDuA-i7ZBmqV7ZnA3c_fvtXnx-?usp=sharing)，[karpathy/nanoGPT](https://github.com/karpathy/nanoGPT)，[karpathy/ng-video-lecture](https://github.com/karpathy/ng-video-lecture)







