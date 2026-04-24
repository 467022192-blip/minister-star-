# Vercel Blob 持久化结果页可用性设计

## 背景

当前仓库已经完成“无数据库可部署”改造，并已成功在 Vercel production 上构建运行。但线上实测显示，关键结果链路仍然不可用：

- `/quiz` 提交后可以跳转到 `/chart?quizSessionId=...`
- `/chart` 提交后可以跳转到 `/result/[sessionId]`
- 但 `/result/[sessionId]` 与 `/share/[sessionId]` 在线上实际返回 `404`

根因不是构建失败，也不是页面本身异常，而是当前无数据库模式下的 session 仍保存在进程内 `Map` 中：

- `lib/repositories/quiz-session-repo.ts` 使用 `quizSessionStore`
- `lib/repositories/chart-session-repo.ts` 使用 `chartSessionStore`

在本地单进程环境下，这种实现可用；但在 Vercel 上，写入请求与后续读取请求可能落到不同实例，导致跨请求读取不到刚写入的 session，于是结果页、分享页和分享卡片接口按当前设计返回 `notFound()` / `404`。

用户当前明确选择：**不接数据库，先用最小方案让线上结果页可用。**

## 目标

本次设计目标如下：

1. 在不引入数据库的前提下，让 Vercel production 上的 `/result/[sessionId]` 可跨请求稳定读取。
2. 同步恢复 `/share/[sessionId]` 与 `/api/share-card/[sessionId]` 的可用性。
3. 尽量保持现有页面路由、server action、repository 接口与结果页逻辑不变。
4. 保留当前 `memory` 与未来 `prisma` 的演进路径，不做破坏性重构。

## 非目标

- 本次不接入 Prisma / Postgres。
- 本次不修改排盘算法、结果文案或埋点语义。
- 本次不处理历史线上 session 补录或迁移；新部署后新产生的数据生效即可。
- 本次不引入额外的缓存层、索引层或后台清理任务。

## 现状与约束

### 已确认的仓库现状

- `lib/db.ts` 当前只有 `memory | prisma` 两态。
- `app/chart/actions.ts` 当前流程是：创建草稿 session -> 计算 -> 写回 computed session -> 跳转结果页。
- `app/result/[sessionId]/page.tsx`、`app/share/[sessionId]/page.tsx`、`app/api/share-card/[sessionId]/route.ts` 都通过 `getResultSessionById()` / `getChartSessionById()` 读取持久化结果；读不到就返回 `404`。
- `tests/setup.ts` 默认将 `ZIWEI_PERSISTENCE_MODE` 设为 `memory`。

### 已确认的 Vercel 现状

- production 里已有 `BLOB_READ_WRITE_TOKEN`。
- 仓库当前没有任何代码引用 `@vercel/blob` 或 `BLOB_READ_WRITE_TOKEN`。
- 当前 production 仍不配置 `DATABASE_URL`，也不准备在本次方案中启用数据库。

### 产品与工程约束

- 当前用户接受“先让线上结果页能打开”的最小方案。
- 不希望为了这个目标改掉现有 URL 结构或结果页 server-rendered 读取路径。
- 未来仍要保留回切 Prisma 的能力。

## 方案对比

### 方案 A：使用 Vercel Blob 持久化 quiz/chart session（推荐）

- 在 repository 层新增 Blob 分支。
- `lib/db.ts` 扩展为 `memory | prisma | blob` 三态。
- 使用 Blob 存储 JSON session 文档，按 `sessionId` 读写。

优点：

- 能直接解决跨请求读不到 session 的根因。
- 页面层与路由层几乎不需要改。
- 与现有 repository 边界兼容，代码改动集中。
- 不依赖数据库，符合当前最小目标。

缺点：

- 这是中间态方案，不是最终长期数据库形态。
- 需要引入新的外部存储依赖与 Blob 读写错误处理。

### 方案 B：只持久化 chart session，quiz 偏好改为 URL 传递

- 结果页链路改用 Blob。
- `/quiz -> /chart` 不再读取 quiz session，而是把轻测试偏好改写进 query 参数或前端状态。

优点：

- 改动量可能更少。

缺点：

- 改变当前产品承接方式。
- 让 quiz session 与 chart session 的处理方式不一致。
- 后续回切 Prisma 时仍要重新整理边界。

### 方案 C：不做服务端持久化，改用 URL / cookie / localStorage 传结果

优点：

- 理论上无需外部持久化服务。

缺点：

- 与当前 server-rendered 结果页结构不匹配。
- 分享页能力差，URL 与数据暴露风险高。
- 容易引入新的状态同步问题。

结论：采用方案 A。

## 设计

### 1. 持久化模式扩展

`lib/db.ts` 的持久化模式从当前的：

```ts
type PersistenceMode = 'memory' | 'prisma'
```

扩展为：

```ts
type PersistenceMode = 'memory' | 'prisma' | 'blob'
```

新的规则如下：

1. 如果 `ZIWEI_PERSISTENCE_MODE=memory`，始终使用 `memory`。
2. 如果 `ZIWEI_PERSISTENCE_MODE=blob`，要求存在 `BLOB_READ_WRITE_TOKEN`，否则明确报错。
3. 如果 `ZIWEI_PERSISTENCE_MODE=prisma`，要求存在 `DATABASE_URL`，否则明确报错。
4. 如果未显式设置模式：
   - `NODE_ENV=test` -> `memory`
   - 非 test 且有 `DATABASE_URL` -> `prisma`
   - 非 test 且无 `DATABASE_URL` 但有 `BLOB_READ_WRITE_TOKEN` -> `blob`
   - 其他情况 -> `memory`

该规则的目的：

- Vercel production 在当前无数据库但已有 Blob token 的前提下，会自动进入 `blob`。
- 本地与测试环境不受影响，仍默认 `memory`。
- 显式强制某种模式时，一旦外部依赖缺失，会立即失败而不是静默降级。

### 2. Blob 存储边界

本次只将**跨请求必须读取的 session 文档**写入 Blob，不额外增加二级索引、列表查询或后台同步任务。

存储 key 约定如下：

- `quiz-sessions/<sessionId>.json`
- `chart-sessions/<sessionId>.json`

每个对象存储当前 repository 已定义的数据结构 JSON：

- quiz session：`{ id, answer }`
- chart session：`ChartSessionRecord`

不再额外引入“结果页专用快照对象”或“分享页专用对象”。结果页、分享页继续读取同一份 computed chart session。

### 3. Blob 访问抽象

新增一个轻量 Blob 辅助层，例如：

- `lib/blob/session-store.ts`

职责只包括：

- 按 key 写入 JSON
- 按 key 读取 JSON
- 在读取时处理“对象不存在”
- 对反序列化失败给出明确错误

这个辅助层不应承载业务判断，不应知道 quiz/chart 的业务含义，只做“JSON object store”。

这样 repository 仍然是业务边界，Blob helper 只是存储适配层。

### 4. Repository 层改造

#### 4.1 `lib/repositories/quiz-session-repo.ts`

保留当前对外接口：

- `getQuizSessionById(sessionId)`
- `saveQuizSession(answer)`

内部按 `getPersistenceMode()` 分支：

- `prisma`：保持现状
- `memory`：保持现状
- `blob`：
  - `saveQuizSession` 生成 `sessionId` 后，把 `{ id, answer }` 写入 `quiz-sessions/<id>.json`
  - `getQuizSessionById` 从对应 key 读取，存在则返回 `{ id, answer }`，不存在返回 `null`

#### 4.2 `lib/repositories/chart-session-repo.ts`

保留当前对外接口：

- `getChartSessionById(sessionId)`
- `createDraftChartSession(input)`
- `saveComputedResult(payload)`
- `markChartSessionFailed(payload)`

内部按 `getPersistenceMode()` 分支：

- `prisma`：保持现状
- `memory`：保持现状
- `blob`：
  - `createDraftChartSession` 生成 `ChartSessionRecord`，写入 `chart-sessions/<id>.json`
  - `saveComputedResult` 读取已有对象，更新为 `computed` 后回写
  - `markChartSessionFailed` 读取已有对象，更新为 `failed` 后回写
  - `getChartSessionById` 直接按 key 读取 JSON

### 5. 页面与数据流

页面层保持现有路径与逻辑不变。

#### 5.1 Quiz 承接链路

- `/quiz` 提交后，`saveQuizSession()` 在 Blob 模式下写入 `quiz-sessions/<sessionId>.json`
- 跳转 `/chart?quizSessionId=<sessionId>`
- `app/chart/page.tsx` 通过 `getQuizSessionById()` 回读 quiz session
- 若读取命中，则继续展示“已承接轻测试偏好”提示
- 若读取缺失，仍按现有行为展示无 quiz session 的 chart 页面

#### 5.2 Chart 到 Result 链路

- `submitChartInput()` 先创建 draft chart session
- 计算成功后，将完整 computed 结果写回 `chart-sessions/<sessionId>.json`
- 随后跳转 `/result/<sessionId>`
- `app/result/[sessionId]/page.tsx` 继续通过 `getResultSessionById()` 读取
- 当 session 存在、状态为 `computed`、且包含 `chartOutput + interpretationOutput` 时，结果页正常渲染

#### 5.3 Share 链路

- `/share/[sessionId]` 与 `/api/share-card/[sessionId]` 继续读取同一个 computed chart session
- Blob 模式下只要结果 session 存在，这两个入口也会恢复可用

### 6. 错误处理

#### 6.1 必须显式失败的场景

- `ZIWEI_PERSISTENCE_MODE=blob` 但缺少 `BLOB_READ_WRITE_TOKEN`
- `ZIWEI_PERSISTENCE_MODE=prisma` 但缺少 `DATABASE_URL`

处理方式：在持久化模式解析阶段直接抛出明确错误，防止误以为已经启用目标持久化。

#### 6.2 默认模式可自动选择的场景

- 无 `DATABASE_URL` 但有 `BLOB_READ_WRITE_TOKEN`：自动使用 `blob`
- 既无数据库也无 Blob token：自动回退 `memory`

处理方式：仅在“未显式设置模式”时允许自动选择。

#### 6.3 Blob 读写失败

对写入链路：

- 如果 quiz/chart session 写 Blob 失败，不返回成功结果，不伪造 session 已保存。
- 让提交直接失败，交由页面现有错误提示或补充后的错误文案处理。

对读取链路：

- 真实不存在的 key -> 返回 `null`
- Blob 返回坏数据或反序列化失败 -> 记录明确错误，并按读取失败处理

结果页/分享页层面仍保留当前 `404` 语义，不新增“半成功页面”。

### 7. 测试与验证

#### 7.1 单元测试

需要补充或更新以下测试：

- `lib/db.ts`
  - 默认无数据库但有 `BLOB_READ_WRITE_TOKEN` 时返回 `blob`
  - 显式 `blob` 且缺 token 时明确报错
- Blob 辅助层
  - JSON 写入 / 读取成功
  - key 不存在返回 `null`
  - 非法 JSON / 缺字段时触发明确失败

#### 7.2 Repository 测试

覆盖至少以下路径：

- `saveQuizSession` -> `getQuizSessionById`
- `createDraftChartSession` -> `saveComputedResult` -> `getChartSessionById`
- `createDraftChartSession` -> `markChartSessionFailed` -> `getChartSessionById`

测试重点是：Blob 模式下跨调用仍能读回完整记录，而不依赖进程内 `Map`。

#### 7.3 集成验证

本地或预发环境验证：

- `/quiz` 提交后能够在 `/chart?quizSessionId=...` 读回 quiz 偏好
- `/chart` 提交后 `/result/[sessionId]` 正常渲染
- `/share/[sessionId]` 正常渲染
- `/api/share-card/[sessionId]` 返回 200 与有效 JSON

#### 7.4 Vercel 线上验收

production 环境显式设置：

- `ZIWEI_PERSISTENCE_MODE=blob`
- 保留 `BLOB_READ_WRITE_TOKEN`
- 不设置 `DATABASE_URL`

部署后验收：

1. 首页 `/` 正常加载
2. `/quiz` 可提交
3. `/chart?quizSessionId=...` 可读到刚写入的 quiz session
4. `/result/[sessionId]` 正常渲染，不再 404
5. `/share/[sessionId]` 正常渲染
6. `/api/share-card/[sessionId]` 返回 200

### 8. 上线与回滚

#### 上线步骤

1. 合入 Blob 持久化代码
2. 在 Vercel production 设置 `ZIWEI_PERSISTENCE_MODE=blob`
3. 确认 `BLOB_READ_WRITE_TOKEN` 存在
4. 保持 `DATABASE_URL` 不配置
5. 重新部署并验收关键链路

#### 回滚策略

如果 Blob 路径异常：

- 将 `ZIWEI_PERSISTENCE_MODE` 改回 `memory`
- 重新部署

这样可以快速恢复到当前已知可运行但结果页不稳定的状态。

本次设计不移除 Prisma 代码，也不破坏未来数据库接入路径，因此后续切到 Prisma 的顺序仍然是：

1. 准备数据库
2. 执行 migration
3. 配置 `DATABASE_URL`
4. 再切 `ZIWEI_PERSISTENCE_MODE=prisma`（如需显式）

## 风险

### 风险 1：Blob 依赖新增后，测试环境误走 Blob

通过以下方式降低风险：

- 继续保持 `NODE_ENV=test -> memory`
- 测试中显式控制 env，避免被本机 token 污染

### 风险 2：Blob 读取坏数据导致结果页异常

通过以下方式降低风险：

- 读取后做最小结构校验
- 坏数据按读取失败处理，不把异常直接暴露给页面

### 风险 3：实现时把 Blob helper 做成新的业务中心

通过以下方式避免：

- Blob helper 仅做 JSON object store
- 业务规则继续留在 repository 与 page/action 边界

## 决策

本次按以下决策执行：

1. 采用 Vercel Blob 作为当前无数据库阶段的跨请求 session 持久化方案。
2. 扩展持久化模式为 `memory | prisma | blob`。
3. 保持现有页面路由、server action 和 repository 对外接口基本不变。
4. 只持久化 quiz session 与 chart session JSON，不增加额外索引或后台任务。
5. 通过显式 `ZIWEI_PERSISTENCE_MODE=blob` 完成 production 切换，并保留未来回切 Prisma 的路径。
