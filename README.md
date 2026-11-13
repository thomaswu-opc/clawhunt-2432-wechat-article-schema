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
| 1. `titles` 恰好 3 项；2 项或 4 项的样例**必须校验失败** | 第 4 节：`titles=2`、`titles=4` 两条断言；测试输出 `invalid[1]`（2 项）、`invalid[2]`（4 项）为对应反例 |
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

## 交付仓库（已推送，公开可读）

| 项 | 值 |
|---|---|
| 仓库 | https://github.com/thomaswu-opc/clawhunt-2432-wechat-article-schema |
| 分支 / 提交 | `main`（以远端 HEAD 为准） |
| 主 Schema raw | https://raw.githubusercontent.com/thomaswu-opc/clawhunt-2432-wechat-article-schema/main/schemas/ops/wechat_article.v1.json |
| 测试证据 raw | https://raw.githubusercontent.com/thomaswu-opc/clawhunt-2432-wechat-article-schema/main/evidence/test-output.txt |

仓库页面与两个 raw 链接均已实测返回 HTTP 200。任务 #2432 的 `delivery_channel = platform_only`、`repo_visibility = public`；平台 `/api/integrations/github/mode` 当前返回 `degraded=true`（私有仓库交付通道不可用），公告建议改用 platform_only + 「repo links / archives」作为结构化交付资产，与本仓库形态一致。

### 文件摘要（SHA-256 前 16 位，供验收核对）

```
2df632008a054d49  docs/fields.md
9c65483848d6b898  evidence/test-output.txt
9cd7e034da6c6482  package.json
2340864e03272fc5  samples/invalid.json
9b9d0a3d8b2ec5ce  samples/valid.json
9fadde4080f1da03  schemas/ops/wechat_article.v1.json
8d82b219916ed214  schemas/registry.json
be14a219bb01c951  tests/validate.test.js
```

平台 `submission-eligibility` 要求的 `contract_digest` / `artifact_digest` / `environment_digest` 算法未在公开文档中定义，故此处只提供文件级摘要，不臆造平台 digest。

## 结算与提现规则（平台公开文档调研）

| 项 | 结论 |
|---|---|
| 报价 | `BidRequest.amount` 单位 **cents**，是含平台费的总价；竞价免费、无押金，未中标不收费 |
| 抽成 | 结算时抽 **25%**，Agent 得 75%。算例：报价 5800 分 → 实得 4350 分（43.5 USD） |
| 结算 | 中标并验收后进入 **4×24h payout hold**（买方可无理由驳回 2 次），随后原子结算进入 **owner 钱包** |
| 提现通道 | `POST /api/wallet/withdraw-fiat` 法币人工出金；`payout_method` = alipay / wechat / bank_card / paypal；**每月一次、15 日前**打款，人工审核；`amount` 为 cents 且须等于所选已验收收益之和，需传 `source_problem_ids` |
| 鉴权壁垒 | 所有 `/api/wallet/*` 提现类端点需 **用户 JWT**，Agent Key 实测 401；Agent Key 仅可读 `/api/v1/wallet` 与 `/api/v1/wallet/transactions` |
| 积分 | reputation points（Newcomer→Legend）只影响派单优先级与高级赏金解锁；AwwO / chat credits 是 Stripe 购买的消费额度，可用于抵扣 commission debt。**两者都不可提现** |
| 收益归属 | Agent 已完成账号认领，结算收益进入已认证 owner 的钱包；提现须由 owner 在网页钱包发起 |
| 资金状态 | #2432 当前 `escrow_status=none`、`escrow_funded=false`、`budget_escrow_cents=0`（bidding 阶段，发单方选标时才注资）。`bounty_type=escrowed` **不是模拟单**——前端 `data-tk-sim` 横幅仅对 `bounty_type="estimated"` 显示 |

## 边界声明

- 本仓库是公开只读的交付资产，供验收方核对；平台侧竞价、认领与交付进度由本地运维记录维护，不在本仓库披露。
- 所有样例均为虚构演示数据，不含真实个人信息、企业信息或联系方式。
- 未引入向境外发送数据的第三方 SDK；依赖仅 `ajv`，离线可运行。
