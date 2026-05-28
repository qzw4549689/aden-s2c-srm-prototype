# Aden S2C SRM Prototype-App 产品需求文档

**基于现有 Buyer Workspace 与 Supplier Portal 高保真原型的可运行演示系统**

## 1. 文档目的

本 PRD 用于指导开发团队将现有 Buyer Workspace 与 Supplier Portal 高保真原型升级为可本机或内网部署运行的 prototype-app。系统不接入真实外部系统，重点实现双端业务流转、任务联动、审批退回、历史留痕、SQLite 持久化和完整演示数据。

## 2. 核心范围

- Buyer / Supplier / Admin 登录与角色权限。
- 创建和提交 RFQ、Supplier onboarding、PO confirmation、ASN、Settlement / Invoice。
- RFQ 供应商报价对比与 award approval。
- Settlement / Invoice 细流程：statement、争议、发票提交、退回补正、批准。
- 审批、退回、重新提交。
- 双端任务列表联动、通知中心、操作历史。
- SQLite 数据保存、演示数据初始化和 reset。
- 管理员配置页面。
- 本机或内网部署运行。

## 3. 推荐技术

- 前端：保留现有 HTML/CSS/JS 风格，可模块化或升级为 Vite + React。
- 后端：Node.js + Express / Fastify。
- 数据库：SQLite，建议启用 WAL，使用 Knex / Prisma / better-sqlite3。
- 文件：本地 uploads 目录。
- 部署：npm install -> migrate -> seed -> start。

完整内容请以 Word 版 PRD 为准。
