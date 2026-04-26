# Vercel Blob 无数据库上线 Runbook / Release Note

> **文档导航**｜发布结论 · 本次发布记录 · 生产最终状态 · 标准执行步骤 · 验收清单 · 回滚方案 · 已知注意事项

## 这次发布已经把无数据库链路从“可构建”推进到“可用”

**结论：`minister-star` 已完成无数据库 Blob 上线。** 线上 `quiz -> chart -> result -> share -> share-card` 主链路可用，`/result/[sessionId]`、`/share/[sessionId]`、`/api/share-card/[sessionId]` 不再因为 Vercel 多实例内存不共享而返回 404。

这份文档同时承担两件事：
- 作为 **release note**，记录这次上线改了什么、部署到了哪里、当前状态如何。
- 作为 **runbook**，供后续同类环境重复执行或排查时直接复用。

---

## 这次发布的核心变化是把跨请求 session 持久化切到 Blob

### 线上问题原因为何会发生

此前 production 虽然已经能在 **无 `DATABASE_URL`** 条件下部署，但 quiz/chart session 仍依赖进程内 `Map`。在 Vercel 上，请求可能落到不同实例，因此“写入 session 的请求”和“读取结果页的请求”不一定命中同一块内存。

直接结果：
- `/quiz` 可提交
- `/chart` 可提交
- 但 `/result/[sessionId]`、`/share/[sessionId]`、`/api/share-card/[sessionId]` 读取不到 session，按设计返回 **404**

### 本次上线做了什么

**这次发布的关键判断不是继续补页面逻辑，而是改持久化边界。**

落地内容包括：
- 新增 Blob JSON helper：`lib/blob/session-store.ts`
- 将 `lib/db.ts` 扩展为 **`memory | prisma | blob` 三态**
- `quiz` / `chart` repository 接入 Blob 分支
- 对 Blob 读取增加 repository 层 shape guard，保证 `/result`、`/share`、`/api/share-card` 拿到的都是可消费数据
- 新增与补强 unit / integration 测试，覆盖：
  - Blob helper 行为
  - 模式选择逻辑
  - quiz/chart/result repository 读写
  - `quiz -> chart` 承接
  - `chart -> result` 成功与失败分支
  - `result` / `share` / `share-card` 在 Blob 模式下的语义
- 更新 README 与 `.env.example`，明确 Blob 是当前 no-DB production 推荐模式

### 本次发布对应提交

核心提交：
- `28b08a9` `feat: add Blob JSON session store helper`
- `5803b1f` `feat: add blob persistence mode selection`
- `dc94c16` `feat: persist quiz and chart sessions in blob mode`
- `4e45008` `test: cover blob-backed submit and share flows`
- `344eb9d` `docs: document blob persistence rollout`

---

## 本次 production 发布记录已经可以作为后续对照基线

### 代码与部署基线

**Git**
- branch: `main`
- remote: `origin=https://github.com/467022192-blip/minister-star-.git`
- 发布后仓库状态：`main...origin/main`，工作树干净

**Vercel**
- scope: `467022192-blips-projects`
- project: `minister-star`
- current production deployment: `dpl_5wUHVDWeX5o6BXDeE8obvwWAR16z`
- production url: `https://minister-star-mpzwgfjll-467022192-blips-projects.vercel.app`
- alias: `https://minister-star.vercel.app`

### 本次线上验收样本

验证中实际生成的样本：
- `quizSessionId=5a8b978a-ea01-43d9-ba3c-98d65fcca2c4`
- `sessionId=0975d6fb-9308-4021-8a56-3da1b9280929`

### 本次验收结论

**正向链路**
- `/` -> **200**
- `/quiz` -> **200**
- `/chart` -> **200**
- `/chart?quizSessionId=5a8b978a-ea01-43d9-ba3c-98d65fcca2c4` 能看到“已承接轻测试偏好”提示
- `/result/0975d6fb-9308-4021-8a56-3da1b9280929` -> **200**
- `/share/0975d6fb-9308-4021-8a56-3da1b9280929` -> **200**
- `/api/share-card/0975d6fb-9308-4021-8a56-3da1b9280929` -> **200**

**负向语义**
- `/result/missing-session-id` -> **404**
- `/share/missing-session-id` -> **404**
- `/api/share-card/missing-session-id` -> **404**

> 这点很重要：**缺失 session 返回 404 仍然是正确语义**。本次修复的是“新写入 session 在 Vercel 上能被后续请求读到”，不是把所有缺失情况改成兜底成功。

---

## 生产最终状态应该保持为 Blob 最小必需配置

### 当前 production 关键 env

**保留：**
- `ZIWEI_PERSISTENCE_MODE=blob`
- `BLOB_READ_WRITE_TOKEN=<present>`

**移除：**
- `DATABASE_URL`
- `PRISMA_DATABASE_URL`
- `POSTGRES_URL`
- `EDGE_CONFIG`

### 模式选择规则

当前代码里的规则是：

| 条件 | 模式 |
|---|---|
| `ZIWEI_PERSISTENCE_MODE=memory` | `memory` |
| `ZIWEI_PERSISTENCE_MODE=prisma` 且 `DATABASE_URL` 存在 | `prisma` |
| `ZIWEI_PERSISTENCE_MODE=blob` 且 `BLOB_READ_WRITE_TOKEN` 存在 | `blob` |
| `NODE_ENV=test` | `memory` |
| 非 test 且有 `DATABASE_URL` | `prisma` |
| 非 test 且无 `DATABASE_URL` 但有 `BLOB_READ_WRITE_TOKEN` | `blob` |
| 其他情况 | `memory` |

### Blob 写入约束

本次实现依赖以下不变量，后续不要随意改：

| 对象 | Blob key | 约束 |
|---|---|---|
| quiz session | `quiz-sessions/{sessionId}.json` | private blob，`addRandomSuffix=false` |
| chart session | `chart-sessions/{sessionId}.json` | private blob，`addRandomSuffix=false`，更新时原 key overwrite |

读取侧同样要求：
- `access: 'private'`
- `useCache: false`

---

## 后续重复上线时，直接按这份步骤执行即可

### Step 0：确认本次变更是否触达 session 持久化边界

- [ ] 是否改动了 `lib/db.ts`
- [ ] 是否改动了 `lib/blob/session-store.ts`
- [ ] 是否改动了 `lib/repositories/quiz-session-repo.ts`
- [ ] 是否改动了 `lib/repositories/chart-session-repo.ts`
- [ ] 是否改动了 `app/result/[sessionId]` / `app/share/[sessionId]` / `app/api/share-card/[sessionId]`

如果以上任一项为是，必须按下面完整 runbook 走完，不要只做 smoke check。

---

### Step 1：本地验证代码与测试

运行全量 unit / integration：

```bash
npm run test:unit
```

最低配构建验证（确保没有数据库、没有 Blob token 时仍能安全编译）：

```bash
env -u DATABASE_URL -u BLOB_READ_WRITE_TOKEN -u ZIWEI_PERSISTENCE_MODE npm run build
```

预期：
- `npm run test:unit` 全绿
- `npm run build` 成功

---

### Step 2：推送代码

```bash
git status --short --branch
git push origin main
```

预期：
- `main` 工作树干净
- push 成功

---

### Step 3：确保 production env 处于 Blob 模式

查看 production env：

```bash
npx vercel@52.0.0 env list production --scope 467022192-blips-projects
```

设置 Blob 模式：

```bash
npx vercel@52.0.0 env add ZIWEI_PERSISTENCE_MODE production --value blob --yes --force --scope 467022192-blips-projects
```

如果要删除 production 上的旧数据库相关 env：

```bash
npx vercel@52.0.0 env rm DATABASE_URL production --yes --scope 467022192-blips-projects
npx vercel@52.0.0 env rm PRISMA_DATABASE_URL production --yes --scope 467022192-blips-projects
npx vercel@52.0.0 env rm POSTGRES_URL production --yes --scope 467022192-blips-projects
npx vercel@52.0.0 env rm EDGE_CONFIG production --yes --scope 467022192-blips-projects
```

必要时拉取 production env 核对最终状态：

```bash
npx vercel@52.0.0 env pull /tmp/ziwei-prod.env --environment=production --scope 467022192-blips-projects
rg -n '^(ZIWEI_PERSISTENCE_MODE|BLOB_READ_WRITE_TOKEN|DATABASE_URL|PRISMA_DATABASE_URL|POSTGRES_URL|EDGE_CONFIG)=' /tmp/ziwei-prod.env
rm -f /tmp/ziwei-prod.env
```

预期：
- `ZIWEI_PERSISTENCE_MODE="blob"`
- `BLOB_READ_WRITE_TOKEN` 存在
- `DATABASE_URL` / `PRISMA_DATABASE_URL` / `POSTGRES_URL` / `EDGE_CONFIG` 不再出现在 production 拉取结果中

> 如果 `env rm` 卡住，可加 `--debug` 单独执行。Vercel CLI 在 agent 场景下偶发会出现“命令挂起但后端已完成删除”的现象，**以最终 `env pull` 结果为准**。

---

### Step 4：触发 production 部署

```bash
npx vercel@52.0.0 --prod --scope 467022192-blips-projects
```

部署完成后确认 alias 指向：

```bash
npx vercel@52.0.0 inspect https://minister-star.vercel.app --scope 467022192-blips-projects
```

预期：
- deployment status = **Ready**
- alias 包含 `https://minister-star.vercel.app`

---

### Step 5：验收正向链路

推荐按下面顺序验证：

- [ ] 打开 `/`
- [ ] 打开 `/quiz`
- [ ] 提交 quiz，确认能承接到 `/chart?quizSessionId=...`
- [ ] 在 `/chart` 填写出生信息并提交
- [ ] 确认进入 `/result/{sessionId}` 而不是 404
- [ ] 打开 `/share/{sessionId}`，确认不是 404
- [ ] 请求 `/api/share-card/{sessionId}`，确认返回 200 JSON

必要时也可用 curl 做基础 HTTP 校验：

```bash
base='https://minister-star.vercel.app'
session='<fresh-session-id>'

curl -s -o /dev/null -w '%{http_code}\n' "$base/result/$session"
curl -s -o /dev/null -w '%{http_code}\n' "$base/share/$session"
curl -s -o /dev/null -w '%{http_code}\n' "$base/api/share-card/$session"
```

---

### Step 6：验收负向语义没有被破坏

```bash
base='https://minister-star.vercel.app'
missing='missing-session-id'

curl -s -o /dev/null -w '%{http_code}\n' "$base/result/$missing"
curl -s -o /dev/null -w '%{http_code}\n' "$base/share/$missing"
curl -s -o /dev/null -w '%{http_code}\n' "$base/api/share-card/$missing"
```

预期：
- 三个缺失场景都返回 **404**

---

## 如果线上异常，需要按影响范围回滚而不是盲目切回 Prisma

### 推荐回滚顺序

**优先级 1：回滚代码或 deployment**

如果 Blob 上线后的页面或接口异常，优先回滚到上一个可用 deployment，而不是临时接数据库。

**优先级 2：保留 Blob env，只修代码重新发版**

如果异常集中在页面消费逻辑或 shape guard，优先保留：
- `ZIWEI_PERSISTENCE_MODE=blob`
- `BLOB_READ_WRITE_TOKEN`

只修代码并重新部署。

**优先级 3：紧急降级到 memory（仅兜底）**

只有在 Blob 服务本身不可用、但必须先恢复 `/quiz`、`/chart` 主入口时，才考虑：

```bash
npx vercel@52.0.0 env add ZIWEI_PERSISTENCE_MODE production --value memory --yes --force --scope 467022192-blips-projects
npx vercel@52.0.0 --prod --scope 467022192-blips-projects
```

这会带来已知退化：
- `/quiz` 与 `/chart` 仍可工作
- **跨请求** 的 `/result`、`/share`、`/api/share-card` 可能重新出现 404

所以这是应急兜底，不是正常回退路径。

---

## 后续维护时最容易踩坑的是环境与测试串扰

### 1. 测试环境默认强制 memory

`tests/setup.ts` 会全局写入：

```ts
process.env.ZIWEI_PERSISTENCE_MODE = 'memory'
```

因此所有 Blob 模式测试都必须显式覆盖并恢复：
- `ZIWEI_PERSISTENCE_MODE`
- `BLOB_READ_WRITE_TOKEN`
- 必要时 `NODE_ENV`

否则很容易出现“以为在测 Blob，实际仍在跑 memory”的假阳性。

### 2. shape guard 是业务边界，不要下沉到 Blob helper

`lib/blob/session-store.ts` 只负责 JSON object store：
- 写 JSON
- 读 JSON
- 不存在返回 `null`
- 非法 JSON 抛错

**结构合法性校验必须留在 repository 层。** 否则 `quiz` / `chart` / `result` 的业务边界会被打散。

### 3. chart session 更新必须是同 key overwrite

`draft -> computed / failed` 必须更新同一个：

```text
chart-sessions/{sessionId}.json
```

不要改成多版本随机 key，否则结果页读取会重新失去确定性。

### 4. 结果页 / 分享页恢复可用，不代表 analytics 已改造

本次发布只覆盖：
- quiz session
- chart session
- result/share/share-card 读取链路

**analytics persistence 不在这次 rollout 范围内。** 不要把这次文档误读成“所有服务端持久化都已经 Blob 化”。

---

## 下次执行时，只需要更新这些字段就能直接复用本文档

- [ ] Git commit / branch
- [ ] 最新 production deployment id
- [ ] 验收时生成的 `quizSessionId`
- [ ] 验收时生成的 `sessionId`
- [ ] 关键路由的 200 / 404 结果
- [ ] 若有新增 env，补到“生产最终状态”章节

如果以上字段更新完，这份文档就可以直接再次作为当次 release note 使用。
