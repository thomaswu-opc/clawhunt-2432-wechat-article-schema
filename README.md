# 试点交付：#2432 公众号推文输出 Schema v1

对应任务：`【S5-OPS-017】会员空间平台 · 公众号推文输出 Schema：标题候选、摘要与分节正文`。

## 目录

```
schemas/ops/wechat_article.v1.json   主 Schema（draft 2020-12）
schemas/registry.json                网关 Schema 注册表接口桩
samples/valid.json                   5 份合法虚构样例
samples/invalid.json                 5 份非法样例（含反例说明）
tests/validate.test.js               校验测试
docs/fields.md                       字段说明表
evidence/test-output.txt             测试输出（证据）
package.json                         依赖声明
```

## 运行

需要 Node 18+。在本目录执行：

```bash
npm install
npm test
```

生成证据文件：

```bash
mkdir -p evidence
npm test 2>&1 | tee evidence/test-output.txt
```

测试基于 `ajv@8` 的 `ajv/dist/2020`（draft 2020-12 实现），不依赖数据库、浏览器、微信开发者工具或任何境外服务。

## 验收对照

| 验收项 | 对应测试 |
|---|---|
| 1. `titles` 为 2 项或 4 项的样例校验失败 | 第 4 节：`titles=2`、`titles=4` 两条断言；`invalid[1]`、`invalid[2]` 为对应样例 |
| 2. `link_placeholder` 不是 `{{signup_link}}` 时校验失败 | 第 5 节；`invalid[3]` 为对应样例 |
| 3. 5 份合法全部通过、5 份非法全部失败 | 第 2、3 节，逐条打印 PASS/FAIL 与 ajv 错误路径 |
| 4. Schema 通过 draft 2020-12 元模式校验 | 第 1 节 `ajv.validateSchema(schema)` |

附加抽查：分节数量下限、对象 `additionalProperties: false`、字数上限、顶层可选 `lint_issues`。

## 集成对接点（对接 S5-GW）

本单依赖「S5-GW 模型网关与 AI 复核队列」，按要求先用接口桩：

- `schemas/registry.json` 是本地注册表桩，真实集成时把 `schemas[0]` 合并进网关配置即可。
- 网关在模型输出后加载 `wechat_article.v1.json` 校验；通过者写入 `ai_review_queue`，**不得直接发布**（桩中已用 `direct_publish: false` 固化）。
- 全文 5000 字上限、标题去重等跨字段规则由网关后置检查器执行，本 Schema 未重复实现，见 `docs/fields.md`。
- 报名费用由下游 `fee_text` 原样引用，模型不计算金额；`signup_block` 的 `additionalProperties: false` 会拒绝模型自造金额字段。

## 边界声明

- 未提交任何平台竞价或交付，未调用写接口；本目录为本地试点产物。
- 所有样例均为虚构演示数据，不含真实个人信息、企业信息或联系方式。
- 未引入向境外发送数据的第三方 SDK；依赖仅 `ajv`，离线可运行。
