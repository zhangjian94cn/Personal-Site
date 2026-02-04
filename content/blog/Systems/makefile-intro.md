---
title: "Makefile 入门指南"
date: "2022-12-06"
tags: [compilation, make, C++]
draft: false
summary: "Makefile 基础教程：理解 targets、prerequisites 和 commands，掌握增量编译核心原理。"
authors: ["default"]
---

本文是对 [Makefile Cookbook](https://makefiletutorial.com/#makefile-cookbook) 的简要翻译。

## 为什么需要 Makefile

Makefile 用于决定一个大型程序的哪一部分需要被重新编译。在大部分情况下，其被用来编译 C 或 C++ 文件。其他语言通常有自己的工具，其用途与 make 类似。

## 运行样例

让我们运行一个最简单的样例：新建文件夹，在其中创建 `Makefile` 文件：

> **需要注意：makefile 中必须使用 tab 进行缩进**

```makefile
hello:
	echo "Hello, World"
```

运行结果：

```bash
$ make
echo "Hello, World"
Hello, World
```

## Makefile 的语法

Makefile 由一系列的 rule 构成，一个 rule 的范式如下：

```makefile
targets: prerequisites
	command
	command
	command
```

- **targets**: 文件名，通过空格分隔。通常，一个 rule 只有一个 target
- **commands**: 用于编译 targets 的指令，需要使用 tab 缩进
- **prerequisites**: 也是文件名，代表"运行命令时的依赖项"

## Make 的本质

来看一个简单的例子：

```makefile
hello:
	echo "Hello, World"
	echo "This line will always print, because the file hello does not exist."
```

让我们来运行 `make`。只要 **hello** 不存在，这些 command 就会运行，反之则不运行。

需要认识到的是：**hello** 同时代表了 target hello 和 file hello，这两者的联系非常紧密。

### 编译 C 文件示例

创建 `blah.c`：

```c
// blah.c
int main() { return 0; }
```

创建 `Makefile`：

```makefile
blah: blah.c
	cc blah.c -o blah
```

当运行 make 时，下面的步骤将会被执行：

1. 第一个 target 将会被选中（默认 target）
2. 检查 prerequisite `blah.c` 是否存在
3. 决定是否需要运行此 target：只有当 `blah.c` 的文件修改时间在 `blah` 之后时才会运行

这就是 **make 的本质**：当 prerequisites 在上次编译之后出现变化，就需要重新编译，反之则不需要。

## 更多的例子

下面的 `Makefile` 最终运行了 3 个 target：

```makefile
blah: blah.o
	cc blah.o -o blah # Runs third

blah.o: blah.c
	cc -c blah.c -o blah.o # Runs second

blah.c:
	echo "int main() { return 0; }" > blah.c # Runs first
```

执行步骤：

1. 首先选择 `blah` target
2. `blah` 需要 `blah.o`，搜索 `blah.o` target
3. `blah.o` 需要 `blah.c`，搜索 `blah.c` target
4. `blah.c` 没有依赖，运行 echo
5. 运行 `cc -c`
6. 运行 `cc`
7. 最终，`blah` 生成

## Make Clean

clean 的语法如下：

```makefile
some_file:
	touch some_file

clean:
	rm -f some_file
```

运行 `make clean` 时，clean 中的内容就会生效。

## 变量

变量只能是 strings，一般使用 `:=`：

```makefile
files := file1 file2
some_file: $(files)
	echo "Look at this variable: " $(files)
	touch some_file

file1:
	touch file1
file2:
	touch file2

clean:
	rm -f file1 file2 some_file
```

引用变量可以使用：`${}` 或 `$()`

```makefile
x := dude

all:
	echo $(x)
	echo ${x}
```
