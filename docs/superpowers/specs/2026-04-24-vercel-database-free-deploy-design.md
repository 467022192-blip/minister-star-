# Vercel 无数据库可部署改造设计

## 背景

当前仓库在 Vercel 上部署失败，直接症状发生在 `npm install` 阶段，日志表现为 npm 内部错误：`Exit handler never called`。

结合仓库现状，存在两个连续风险：

1. `package-lock.json` 中的 `resolved` 地址大量指向内网源 `bnpm.byted.org`，公网 Vercel 构建机无法稳定访问。
2. `vercel.json` 目前在构建阶段强制执行 `npx prisma migrate deploy && npx prisma generate && next build`，这要求部署环境在构建期即可访问数据库。

当前业务目标不是立刻完成数据库上线，而是优先让站点可以在 Vercel 上成功构建和运行。用户已明确接受当前版本先以“无数据库可部署”为目标。

## 目标

本次改造的目标如下：

1. 让项目在未配置 `DATABASE_URL` 的情况下也能在 Vercel 上成功构建并运行。
2. 保留 Prisma 相关依赖、schema 和后续接库路径，不做破坏性删除。
3. 将线上默认持久化行为改为环境感知：未配置数据库时自动走 `memory`，后续补库后再切回 Prisma。
4. 去除当前锁文件中的内网源依赖，保证仓库可被公网构建机直接安装。

非目标：

- 本次不接入真实数据库。
- 本次不在 Vercel 上执行 Prisma 迁移。
- 本次不调整业务功能范围。

## 约束与现状

### 当前仓库约束

- `prisma/schema.prisma` 使用 `postgresql` 数据源，`url = env("DATABASE_URL")`。
- `lib/db.ts` 当前默认在非测试环境下返回 `prisma` 持久化模式。
- `README.md` 当前将生产部署描述为 Prisma/Postgres 必选路径。
- `vercel.json` 当前将数据库迁移与 Prisma client 生成耦合到每次 Vercel 构建中。

### 已确认的产品/部署约束

- 当前没有可用的线上 Postgres 连接串。
- 用户接受当前线上版本“可运行但不持久”。
- 后续仍需要保留接入 Postgres 的能力。

## 方案对比

### 方案 A：默认无数据库部署，运行时按环境自动选择持久化方式（推荐）

- 保留 Prisma 依赖与 schema。
- 构建命令改成只执行 `next build`。
- 运行时未配置 `DATABASE_URL` 时默认使用 `memory`。
- 运行时存在 `DATABASE_URL` 时默认使用 Prisma。
- 若显式设置 `ZIWEI_PERSISTENCE_MODE=memory`，则强制使用 `memory`。
- 若显式设置 `ZIWEI_PERSISTENCE_MODE=prisma` 但缺少 `DATABASE_URL`，则明确报错。

优点：

- 改动最小，风险最低。
- 能最快恢复 Vercel 部署。
- 不阻断后续接库。

缺点：

- 当前线上数据不持久。

### 方案 B：保留 Prisma generate，但移除 migrate

- 构建命令改为 `npx prisma generate && next build`。
- 运行时仍按环境决定是否走 Prisma。

优点：

- 更接近未来接库形态。

缺点：

- 构建仍额外依赖 Prisma 生成步骤。
- 对当前“先恢复部署”目标没有明显收益。

### 方案 C：暂时移除 Prisma 相关代码

优点：

- 当前部署链路最简单。

缺点：

- 回接数据库成本高。
- 改动破坏性强，不符合当前目标。

结论：采用方案 A。唯一启用规则如下：未显式配置模式时，运行时在存在 `DATABASE_URL` 时默认使用 Prisma，不存在 `DATABASE_URL` 时默认使用 `memory`；显式模式仅用于覆盖默认行为，其中显式 `prisma` 且无库时报错。

## 设计

### 1. 依赖安装与锁文件策略

需要将当前仓库从内网 registry 锁定状态恢复为公网可安装状态。

具体动作：

- 新增项目级 `.npmrc`，内容为 `registry=https://registry.npmjs.org`。
- 重新生成 `package-lock.json`，使 `resolved` 地址统一指向公网 npm registry，而不是 `bnpm.byted.org`。

这样做的目的不是改变依赖版本，而是确保 Vercel 构建机可以稳定获取 tarball。

### 1.1 安装阶段约束

本次设计明确要求：`npm install` 必须在未配置 `DATABASE_URL` 的环境中也能通过。

已验证的事实：

- 在干净目录、移除 `.env` 且未设置 `DATABASE_URL` 的条件下，`npm install` 可成功完成。
- 在同样条件下，`npx -y npm@10 install` 也可成功完成。

因此，本次实现不需要额外增加“跳过 Prisma install-time generate”之类的特殊措施；当前阻塞安装的主要问题是锁文件中的内网 registry，而不是 Prisma 在 install 阶段强依赖数据库。

### 2. Vercel 构建策略

`vercel.json` 的 `buildCommand` 改为仅执行：

```json
"buildCommand": "next build"
```

理由：

- 数据库迁移不应绑定到前端构建生命周期。
- 当前没有 `DATABASE_URL`，构建阶段不应强依赖外部数据库。
- Prisma migration 与 generate 可以在未来接库时通过手动运维步骤补上。

### 3. 运行时持久化策略

`lib/db.ts` 调整为环境感知逻辑：

1. 如果 `ZIWEI_PERSISTENCE_MODE` 显式设置为 `memory`，始终使用 `memory`。
2. 如果 `ZIWEI_PERSISTENCE_MODE` 显式设置为 `prisma`：
   - 存在 `DATABASE_URL` 时使用 Prisma。
   - 不存在 `DATABASE_URL` 时抛出明确错误。
3. 如果未显式设置模式：
   - 在测试环境下默认 `memory`。
   - 在非测试环境且存在 `DATABASE_URL` 时使用 Prisma。
   - 在非测试环境且不存在 `DATABASE_URL` 时使用 `memory`。

这条规则保证：

- 当前 Vercel 无数据库环境可直接运行。
- 后续接库时，只需补环境变量并显式/隐式切回 Prisma。
- 不会出现“用户以为在写库，实际上静默降级了”的假成功场景。

### 4. 受影响面

当前会受影响的行为主要有：

- 测试结果、排盘结果、埋点事件等持久化写入路径。
- 依赖仓库层的 API 路由。

在无数据库部署模式下：

- 这些写入将进入内存仓库。
- 单实例生命周期内可用，但不保证跨实例、跨重启、跨重部署持久。

不受影响的行为：

- 不依赖数据库的页面渲染。
- 静态资源与前端构建。

### 5. README 与部署说明

README 的部署说明需要与新现实保持一致：

- 当前支持“无数据库先部署”。
- 若需启用持久化，默认只要配置 `DATABASE_URL` 即可自动走 Prisma；若需要强制控制，也可以额外设置 `ZIWEI_PERSISTENCE_MODE`。
- Prisma 迁移从“每次部署自动执行”改为“接入数据库时手动执行”。

## 错误处理

### 可自动降级

- 未配置 `DATABASE_URL`。
- 未显式要求 Prisma。

处理方式：自动使用 `memory`。

### 必须显式失败

- `ZIWEI_PERSISTENCE_MODE=prisma`，但缺失 `DATABASE_URL`。

处理方式：抛出明确错误，防止误判为已经启用数据库持久化。

## 验证方案

实现后需要完成以下验证：

1. 在干净环境中重新安装依赖，确认 `package-lock.json` 不再引用 `bnpm.byted.org`。
2. 在未设置 `DATABASE_URL` 的前提下执行 `next build`，确认构建成功。
3. 在未设置 `DATABASE_URL` 的前提下启动生产服务，确认关键页面/API 不因缺数据库直接崩溃。
4. 检查运行时持久化策略：无库时默认 `memory`，有库时默认 Prisma，显式 `prisma` 且无库时报错。

## 上线后的 Vercel 操作

本次上线后的 Vercel 要求：

- 暂时不配置 `DATABASE_URL`。
- 直接重新触发部署。

后续启用数据库时：

1. 配置 `DATABASE_URL`。
2. 如需显式控制，再设置 `ZIWEI_PERSISTENCE_MODE=prisma`。
3. 手动执行 Prisma migration。

## 风险

### 风险 1：线上数据不持久

这是本次方案的已知接受风险，不是缺陷。当前目标是先恢复可部署状态。

### 风险 2：代码路径中仍存在构建时强依赖 Prisma 的隐式导入

需要通过本地生产构建与启动验证覆盖。如果存在此类路径，需要进一步做惰性初始化或边界隔离。

### 风险 3：未来重新切回 Prisma 时配置不清晰

通过 README 说明和明确的运行时错误文案降低认知成本。

## 决策

本次按以下决策执行：

1. 将依赖锁文件切回公网 npm registry。
2. 移除 Vercel 构建期对 Prisma migration/generate 的强依赖。
3. 将默认持久化模式改为环境感知：无 `DATABASE_URL` 时用 `memory`，有 `DATABASE_URL` 时用 Prisma。
4. 保留 Prisma 能力，作为后续接库路径。
