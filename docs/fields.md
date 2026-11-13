# 公众号推文输出 Schema v1 · 字段说明

文件：`schemas/ops/wechat_article.v1.json`，方言 JSON Schema draft 2020-12。所有对象均设置 `additionalProperties: false`。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `titles` | array\<string\> | 正好 3 项；每项 1–64 字 | 标题候选，供运营复核时三选一 |
| `summary` | string | ≤ 120 字 | 摘要 |
| `lead` | string | ≤ 300 字 | 导语 |
| `sections` | array\<object\> | 3–8 项 | 分节正文 |
| `sections[].heading` | string | 1–20 字 | 小节标题 |
| `sections[].kind` | enum | `highlights` / `speakers` / `agenda` / `signup` / `notes` / `other` | 小节类型 |
| `sections[].body` | string | ≤ 1500 字 | 小节正文 |
| `signup_block` | object | 必填 `text`、`link_placeholder` | 报名区块 |
| `signup_block.text` | string | ≤ 200 字 | 报名引导文案 |
| `signup_block.link_placeholder` | const | 固定 `{{signup_link}}` | 发布阶段由网关替换为真实链接 |
| `cover_image_brief` | string | ≤ 200 字 | 给设计师的文字简报，不是图片地址 |
| `lint_issues` | array\<object\> | 顶层可选 | 系统复核时写入，模型输出不得包含；元素含 `code`、`message`，可选 `severity`（`info`/`warn`/`error`） |

## 不在本 Schema 实现的规则

| 规则 | 归属 | 处理方式 |
|---|---|---|
| 全文总字数上限 5000 字 | 后置检查器 | Schema 中不重复实现，已在根 `description` 与 `$comment` 注明 |
| 标题候选之间的重复度、hook 类型去重 | 后置检查器 | 同上，跨字段规则由 S5-GW 承担 |
| 报名费用由 `fee_text` 原样引用，AI 不计算金额 | 下游业务约束 | 本 Schema 不新增 `fee_text` 字段；`signup_block` 的 `additionalProperties: false` 会拒绝模型自造金额字段 |
| 校验通过后进入复核队列，不直接对外发送 | 网关流程 | `schemas/registry.json` 中 `route_after_validation: ai_review_queue`、`direct_publish: false` |

## 数据合规

全部样例使用虚构企业名、角色占位与占位链接，不含真实人名、电话、邮箱或企业信息，不出现客户名称。
