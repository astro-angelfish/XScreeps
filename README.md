# qxscreeps

## 介绍

这是一个半自动的 Screeps 全套项目代码。\
Screeps 是一款硬核大型多人在线编程游戏，目前在 Steam 有上架。

此仓库源码可以随意修改和使用，有 bug 也可以随时在群内找 @QiroNT 反馈。\
不要拿代码欺负萌新（太欠收拾的除外）

### 功能

- 孵化模块
- 任务角色制系统
- lab 的 boost、合成
- 主动防御、战争模块
- 寻路、跨 shard (我们是超时空军团)
- 自动交易

## 安装使用

首先，下载 Node.js (<https://nodejs.org/>) (>=v16)。\
在 <https://pnpm.io/zh/installation> 找一个合适的安装方式安装 pnpm。\
将 `sample.secret.json` 复制一份，命名为 `.secret.json`，在其中填写你的 token 和分支名。

```bash
# 安装依赖
$ pnpm i

# 构建项目
$ pnpm build

# 构建并推送代码
$ pnpm push

# 检查项目内问题
$ pnpm lint
```

如果环境有什么搞不定的地方，请百度搜索 hoho 的 screeps 教程。

## 仓库

本仓库为 QiroNT 维护分支，代码经过大幅整理和调整，与其它上游分支差距较大。\
分支上游作者：superbitch, E19N2, somygame, Monero\
上游地址：<https://gitee.com/mikebraton/xscreeps>

更换 license 许可：

```log
QiroNT#チノNaïve 2022-4-22 20:58:42
我好想换个 license 然后丢到 github 上

superbitch 2022-4-22 21:00:11
可以，github上你上传就行

QiroNT#チノNaïve 2022-4-22 21:01:48
换个 license 的话 gitee 也会换，不换你分支的倒是（

QiroNT#チノNaïve 2022-4-22 21:01:53
换成 MIT 行吗

superbitch 2022-4-22 21:02:17
可以
```
