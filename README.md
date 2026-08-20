# dsh-humanizer

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的写作插件集。核心命题是——**不是「像人写」，而是「像我写」**：一边去掉通用 AI 腔，一边学习你本人的写作指纹，把任意草稿改成「你写的」。

这些插件是 Agent 里的 **skill**，本身**不依赖 LLM 服务、不做模型调用**：它们只负责规则、指纹、打分，以及产出「改写 brief」；真正的改写由 Agent 自己完成。

「Everything is a Plugin」——每个包都是标准的 DSH bundle。

## 架构

```
packages/
├── writing-core/   共享库（纯函数、零运行时依赖、可单测）
│   ├── rules.ts         AI 写作模式规则库（英文 + 中文，stop-slop / Humanizer-zh 思路）
│   ├── analyze.ts       去 AI 味扫描 → AI 分数 + 问题清单
│   ├── fingerprint.ts   文风指纹提取（句长/节奏/标点/人称/高频词）
│   ├── score.ts         相似度打分（0–100 + 分项）
│   └── render.ts        渲染 + 改写 brief 构建
├── humanizer/      插件① @dsh/humanizer —— 去 AI 味层
└── voice/          插件② @dsh/voice      —— 个人文风克隆层
```

`writing-core` 是普通依赖（非 bundle），两个插件各自引用它，对应 DSH 文档里的 capability layering 思路。

## 插件① `@dsh/humanizer` —— 去 AI 味

三个工具（全部确定性、无模型调用）：

| 工具 | 作用 |
|---|---|
| `humanize_scan` | 检测：AI 分数 + 命中的规则清单 |
| `humanize_rules` | 导出完整规则库（透明、可编辑） |
| `humanize_rewrite` | 产出改写 brief（规则 + 本文命中问题），Agent 按 brief 自己改写 |

检测维度（`rules.ts`）：空洞开场、AI 套话、hedge 保守表述、模板连接词、机械排比、总结式结尾、过度解释。英文 + 中文各一套。

## 插件② `@dsh/voice` —— 个人文风克隆

五个工具（全部确定性、无模型调用）：

| 工具 | 作用 |
|---|---|
| `voice_import` | 导入样本 → 提取文风指纹 → 持久化 Profile |
| `voice_profile` | 查看单个 Profile / 列出全部 |
| `voice_remove` | 删除 Profile |
| `voice_score` | 文本与 Profile 的相似度（0–100 + 分项） |
| `voice_rewrite` | 产出改写 brief（指纹 + 代表样本 few-shot + 本文命中问题） |

指纹维度（`fingerprint.ts`）：平均/中位句长、节奏 burstiness、短句/长句占比、标点习惯（破折号/省略号/分号等，每百词计数）、人称立场、hedge/连接词频率、词汇丰富度、高频词与常用句首。Profile 默认持久化到 `~/.dsh/voice-profiles.json`。

## 符合 DSH 规范的要点

- 插件即 TS 模块：导出 `name` + `inject` + `apply(ctx, config)`（`@deepseek-ai/cordis`）。
- 工具用 `defineTool`（`@deepseek-ai/dsh-tools`）注册，`parameters`/`output.schema`/`render`/`execute` 完整。
- 配置用 `export interface Config` + 同名 `Config: Schema<Config>`（`@deepseek-ai/schemastery`）。
- 只注入 `tools` 服务，**不依赖 `llm`**——插件不发起任何模型调用。
- 打包：`dsh.bundle` 清单 + `cordis.patch.yml`，`prepare` 脚本产出 `lib/`。

## 安装

### 方式一：本地源码 `--patch`（开发）

DSH 开发教程的方式，直接把 `.ts` 入口按绝对路径注入：

```yaml
# cordis.patch.yml
- insert:
    - id: humanizer
      name: /absolute/path/to/dsh-humanizer/packages/humanizer/src/index.ts
    - id: voice
      name: /absolute/path/to/dsh-humanizer/packages/voice/src/index.ts
```

```sh
pnpm dsh web --patch ./cordis.patch.yml
```

### 方式二：打包安装

先发布三个包（`@dsh/writing-core` → `@dsh/humanizer` / `@dsh/voice`），或直接从 git 安装（`prepare` 会自行构建）：

```sh
dsh plugin --profile demo add github:you/dsh-humanizer#<sha>   # 或 add ./packages/voice
```

## 配置示例

```yaml
- insert:
    - id: voice
      name: '@dsh/voice'
      config:
        storagePath: ~/.dsh/voice-profiles.json
        strength: standard
        maxExcerpts: 3
```

## 使用示例（Agent 视角）

```
用户：这是我写的十几条推文，帮我建个「我的文风」。

Agent：
  1. voice_import(name="me-x", samples=[...])        → 提取指纹并保存
  2. 回复指纹摘要（句长、节奏、高频词……）

用户：把这段 AI 写的发布稿改成我的口吻。

Agent：
  1. voice_score(text=草稿, name="me-x")              → 当前相似度 41/100
  2. voice_rewrite(text=草稿, name="me-x")            → 拿到改写 brief（指纹 + 样本 + 命中问题）
  3. Agent 按 brief 自己改写草稿
  4. voice_score(改写结果, name="me-x")                → 83/100，确认达标
```

## 开发

```sh
npm install
npm run typecheck   # tsc 全量类型检查（针对真实 @deepseek-ai/* 类型）
npm test            # writing-core 单元测试
npm run build       # 依序产出三个包的 lib/
```

## 设计取舍

- **插件不调 LLM**：规则、指纹、打分都是确定性计算，可复现、可单测；`*_rewrite` 只返回「改写 brief」，改写动作由 Agent 自身完成。
- **持久化用文件而非 `ctx.storage` 后端**：`~/.dsh/*.json` 让插件在无 storage 后端的情况下也能启动，部署门槛最低。
- **`voice_score` 分项输出**：给出「哪里像、哪里不像」，为后续「根据反馈继续学习」留出接口。
