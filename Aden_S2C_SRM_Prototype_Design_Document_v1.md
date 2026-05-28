# Aden S2C SRM Prototype-App 设计文档

**版本**: v1.0  
**日期**: 2026-05-28  
**基于**: PRD v1.0 + 众益集团SRM系统操作手册参考

---

## 一、项目概述

### 1.1 目标
将现有 Buyer Workspace 与 Supplier Portal 高保真静态原型升级为可运行的演示系统，支持真实业务流转、审批退回、双端任务联动和操作历史。

### 1.2 核心原则
- **保留现有 UI 风格**：Aden 橙白视觉、左侧导航、抽屉详情、卡片式工作台
- **聚焦演示主线**：RFQ → 报价 → Award → PO → ASN → Settlement → Invoice
- **Supplier Onboarding** 作为独立流程
- **Admin** 仅保留用户/配置/数据重置
- **不实现**：物料管理、BOM、批文、合同变更、生产任务单、客诉单、数据报表等复杂功能

### 1.3 部署范围
- Vercel 云端部署，客户可直接访问
- 内存数据库（每次部署重置为演示数据）
- 不接入真实 D365、OCR、发票验真、邮件或短信服务

---

## 二、用户角色与权限

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| Buyer Admin | `buyer` | `demo123` | 全部 Buyer 功能 + Admin 入口 |
| Supplier 1 | `supplier1` | `demo123` | FreshFarm Distribution 数据 |
| Supplier 2 | `supplier2` | `demo123` | Jixiang Wonton Food Supply 数据 |
| Supplier 3 | `supplier3` | `demo123` | SuXin Food / Su Xiao Liu 数据 |
| Supplier 4 | `supplier4` | `demo123` | GreenBox Packaging 数据 |
| Supplier 5 | `supplier5` | `demo123` | North Star Logistics 数据 |
| Admin | `admin` | `demo123` | 系统配置、数据重置 |

> **数据隔离原则**：Supplier 只能看到 `org_id` 匹配的本公司数据

---

## 三、数据模型

### 3.1 组织与用户

#### organizations（Buyer公司 + 供应商公司）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| type | TEXT | `buyer` / `supplier` |
| legal_name | TEXT | 公司全称 |
| short_name | TEXT | 简称 |
| tax_no | TEXT | 税号 |
| bank_account | TEXT | 银行账号 |
| bank_name | TEXT | 开户行 |
| address | TEXT | 地址 |
| status | TEXT | `active` / `inactive` |

#### users（登录用户）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| email | TEXT | 邮箱 |
| password_hash | TEXT | bcrypt 哈希 |
| display_name | TEXT | 显示名称 |
| role | TEXT | `buyer` / `supplier` / `admin` |
| org_id | INTEGER FK | 所属组织 |
| status | TEXT | `active` / `inactive` |
| last_login_at | TEXT | ISO 时间 |

---

### 3.2 供应商准入 (Supplier Onboarding)

#### supplier_profiles

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| org_id | INTEGER FK | 所属组织 |
| category | TEXT | 品类：Food ingredients / Frozen food / Packaging / LSP |
| qualification_status | TEXT | 准入状态 |
| score | INTEGER | 评分 0-100 |
| service_area | TEXT | 服务区域 |
| contact_name | TEXT | 联系人姓名 |
| contact_phone | TEXT | 联系人电话 |
| contact_email | TEXT | 联系人邮箱 |
| business_license_no | TEXT | 营业执照号 |
| business_license_file | TEXT | 营业执照附件路径 |
| tax_certificate_no | TEXT | 税务登记证号 |
| tax_certificate_file | TEXT | 税务登记证附件 |
| food_safety_cert_no | TEXT | 食品安全证号 |
| food_safety_cert_file | TEXT | 食品安全证附件 |
| bank_name | TEXT | 开户行名称 |
| bank_account | TEXT | 银行账号 |
| bank_branch | TEXT | 开户支行 |
| submitted_at | TEXT | 提交时间 |
| approved_at | TEXT | 批准时间 |
| rejected_at | TEXT | 拒绝时间 |
| rejection_reason | TEXT | 拒绝/退回原因 |
| version | INTEGER | 资料版本号 |
| created_by | INTEGER FK | 创建人 |
| updated_by | INTEGER FK | 更新人 |

**状态机**：
```
Draft → Submitted → Buyer Review → Returned → Resubmitted → Approved
                              ↓
                           Rejected
```

---

### 3.3 RFQ + 报价

#### rfqs（询价单主表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| rfq_no | TEXT | 编号，如 RFQ-2605-018 |
| title | TEXT | 标题 |
| category | TEXT | 品类 |
| status | TEXT | 状态 |
| due_at | TEXT | 报价截止时间 |
| created_by | INTEGER FK | 创建人 |
| published_at | TEXT | 发布时间 |
| award_supplier_id | INTEGER FK | 中标供应商 |
| award_amount | REAL | 中标金额 |
| rejection_reason | TEXT | 退回原因 |
| revision_count | INTEGER | 修订次数 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

#### rfq_items（询价单行项目）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| rfq_id | INTEGER FK | 所属 RFQ |
| item_name | TEXT | 物料名称 |
| description | TEXT | 描述 |
| qty | REAL | 数量 |
| uom | TEXT | 单位 |
| delivery_date | TEXT | 交付日期 |
| remarks | TEXT | 备注 |

#### rfq_invitations（供应商邀请）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| rfq_id | INTEGER FK | 所属 RFQ |
| supplier_org_id | INTEGER FK | 被邀请供应商 |
| status | TEXT | `pending` / `accepted` / `declined` |
| invited_at | TEXT | 邀请时间 |
| responded_at | TEXT | 响应时间 |

#### quotes（供应商报价头）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| rfq_id | INTEGER FK | 所属 RFQ |
| supplier_org_id | INTEGER FK | 报价供应商 |
| status | TEXT | `draft` / `submitted` / `revised` / `withdrawn` |
| total_amount | REAL | 总价 |
| currency | TEXT | 币种，默认 CNY |
| lead_time | TEXT | 交期 |
| moq | TEXT | 最小订单量 |
| validity_days | INTEGER | 报价有效期天数 |
| remarks | TEXT | 备注 |
| submitted_at | TEXT | 提交时间 |
| revision_no | INTEGER | 修订版本 |

#### quote_items（供应商报价行）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| quote_id | INTEGER FK | 所属报价 |
| rfq_item_id | INTEGER FK | 对应 RFQ 行项目 |
| unit_price | REAL | 单价 |
| amount | REAL | 行金额 |
| remarks | TEXT | 备注 |

**状态机**：

| 对象 | 状态 |
|------|------|
| RFQ | Draft → Published → Quoting → Comparison → Award Pending → Returned → Award Approved → Closed |
| Quotation | Invited → Draft → Submitted → Revised → Withdrawn |
| RFQ Invitation | Pending → Accepted → Declined |

---

### 3.4 PO + 确认

#### purchase_orders（采购订单）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| po_no | TEXT | 编号，如 PO-45001288 |
| supplier_org_id | INTEGER FK | 供应商 |
| status | TEXT | 状态 |
| site | TEXT | 站点 |
| delivery_date | TEXT | 交付日期 |
| total_amount | REAL | 总金额 |
| currency | TEXT | 币种 |
| contract_id | INTEGER FK | 关联合同 |
| created_by | INTEGER FK | 创建人 |
| created_at | TEXT | 创建时间 |

#### po_lines（PO 行项目）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| po_id | INTEGER FK | 所属 PO |
| item_name | TEXT | 物料名称 |
| qty | REAL | 数量 |
| uom | TEXT | 单位 |
| unit_price | REAL | 单价 |
| confirmed_qty | REAL | 确认数量 |
| remarks | TEXT | 备注 |

#### po_confirmations（PO 确认与变更）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| po_id | INTEGER FK | 所属 PO |
| supplier_org_id | INTEGER FK | 供应商 |
| status | TEXT | 状态 |
| proposed_date | TEXT | 建议交期 |
| change_type | TEXT | `delivery` / `quantity` / `other` |
| change_reason | TEXT | 变更原因 |
| comments | TEXT | 备注 |
| submitted_at | TEXT | 提交时间 |
| reviewed_at | TEXT | 审核时间 |

**状态机**：
```
Pending Supplier → Confirmed → Change Requested → Buyer Review → Rejected → Closed
              ↓
           Partially Confirmed
```

---

### 3.5 ASN

#### asns（发货通知）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| asn_no | TEXT | 编号，如 ASN-2605-001 |
| po_id | INTEGER FK | 关联 PO |
| supplier_org_id | INTEGER FK | 供应商 |
| status | TEXT | 状态 |
| ship_date | TEXT | 发运日期 |
| eta | TEXT | 预计到达 |
| carrier | TEXT | 承运方 |
| tracking_no | TEXT | 运单号 |
| total_cartons | INTEGER | 总箱数 |
| total_pallets | INTEGER | 总托盘数 |
| remarks | TEXT | 备注 |
| submitted_at | TEXT | 提交时间 |

#### asn_lines（ASN 行项目）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| asn_id | INTEGER FK | 所属 ASN |
| po_line_id | INTEGER FK | 对应 PO 行项目 |
| ship_qty | REAL | 发运数量 |
| batch_no | TEXT | 批次号 |
| remarks | TEXT | 备注 |

#### asn_exceptions（ASN 异常登记）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| asn_id | INTEGER FK | 所属 ASN |
| exception_type | TEXT | 异常类型 |
| description | TEXT | 描述 |
| reported_by | INTEGER FK | 报告人 |
| reported_at | TEXT | 报告时间 |
| status | TEXT | `open` / `resolved` |

**状态机**：
```
Draft → Submitted → Buyer Review → Accepted → Closed
                    ↓
                 Exception → Resolved
```

**异常类型**：
| 类型 | 说明 |
|------|------|
| quantity_diff | 数量差异 |
| temperature | 温控问题 |
| label | 标签问题 |
| packaging | 包装破损 |
| delay | 延迟到达 |
| batch | 批次问题 |

---

### 3.6 Settlement + Invoice

#### settlements（结算单）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| settlement_no | TEXT | 编号，如 STM-2605-144 |
| supplier_org_id | INTEGER FK | 供应商 |
| period | TEXT | 结算期间，如 2026-05 |
| status | TEXT | 状态 |
| total_amount | REAL | 总金额 |
| dispute_amount | REAL | 争议金额 |
| dispute_reason | TEXT | 争议原因 |
| dispute_attachment | TEXT | 争议附件 |
| created_by | INTEGER FK | 创建人 |
| published_at | TEXT | 发布时间 |
| confirmed_at | TEXT | 确认时间 |
| created_at | TEXT | 创建时间 |

#### settlement_lines（结算明细）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| settlement_id | INTEGER FK | 所属结算单 |
| po_id | INTEGER FK | 关联 PO |
| asn_id | INTEGER FK | 关联 ASN |
| item_name | TEXT | 物料名称 |
| received_qty | REAL | 收货数量 |
| unit_price | REAL | 单价 |
| amount | REAL | 金额 |
| variance_note | TEXT | 差异说明 |

#### invoices（发票）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| settlement_id | INTEGER FK | 关联结算单 |
| invoice_no | TEXT | 发票号 |
| invoice_date | TEXT | 发票日期 |
| amount | REAL | 含税金额 |
| tax_amount | REAL | 税额 |
| tax_rate | REAL | 税率 |
| currency | TEXT | 币种 |
| ocr_status | TEXT | `pending` / `passed` / `exception` |
| verification_status | TEXT | 验真状态 |
| status | TEXT | 发票状态 |
| attachment | TEXT | 附件路径 |
| rejection_reason | TEXT | 退回原因 |
| submitted_at | TEXT | 提交时间 |
| approved_at | TEXT | 批准时间 |

**状态机**：

| 对象 | 状态 |
|------|------|
| Settlement | Draft → Published → Supplier Confirmed → Disputed → Buyer Review → Invoice Requested → Invoice Submitted → Returned → Approved → Closed |
| Invoice | Draft → Submitted → OCR Pending → OCR Passed → Under Review → Returned → Resubmitted → Approved → Rejected |

**OCR 模拟规则**：
- 上传后随机显示 `passed` 或 `exception`
- Exception 时显示原因（如：税号不匹配、金额不符）

---

### 3.7 审批流

#### approval_requests（通用审批头）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| object_type | TEXT | `rfq` / `onboarding` / `po` / `asn` / `settlement` / `invoice` |
| object_id | INTEGER | 业务对象 ID |
| status | TEXT | `pending` / `approved` / `returned` / `rejected` / `cancelled` |
| current_step | INTEGER | 当前审批步骤 |
| submitted_by | INTEGER FK | 提交人 |
| submitted_at | TEXT | 提交时间 |
| completed_at | TEXT | 完成时间 |

#### approval_actions（审批动作）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| approval_id | INTEGER FK | 所属审批 |
| action | TEXT | `approve` / `return` / `reject` / `resubmit` |
| actor_id | INTEGER FK | 操作人 |
| comments | TEXT | 审批意见 |
| action_at | TEXT | 操作时间 |

---

### 3.8 任务 + 通知 + 审计

#### tasks（双端任务）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| assignee_user_id | INTEGER FK | 被指派人 |
| org_id | INTEGER FK | 所属组织 |
| object_type | TEXT | 关联业务类型 |
| object_id | INTEGER | 关联业务 ID |
| title | TEXT | 任务标题 |
| status | TEXT | `open` / `completed` / `overdue` |
| due_at | TEXT | 截止日期 |
| created_at | TEXT | 创建时间 |
| completed_at | TEXT | 完成时间 |

#### notifications（通知中心）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| user_id | INTEGER FK | 接收用户 |
| title | TEXT | 标题 |
| message | TEXT | 内容 |
| object_type | TEXT | 关联业务类型 |
| object_id | INTEGER | 关联业务 ID |
| is_read | INTEGER | 0/1 |
| created_at | TEXT | 创建时间 |

#### audit_logs（操作历史）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| actor_id | INTEGER FK | 操作人 |
| object_type | TEXT | 业务对象类型 |
| object_id | INTEGER | 业务对象 ID |
| action | TEXT | 动作 |
| before_json | TEXT | 变更前状态 JSON |
| after_json | TEXT | 变更后状态 JSON |
| comments | TEXT | 备注 |
| created_at | TEXT | 创建时间 |

---

## 四、API 设计

### 4.1 认证

```
POST /api/auth/login          # 登录
POST /api/auth/logout         # 退出
GET  /api/me                  # 当前用户信息
```

### 4.2 任务中心

```
GET  /api/tasks?status=&type=&page=     # 任务列表
POST /api/tasks/:id/complete            # 完成任务
```

### 4.3 通知

```
GET  /api/notifications                 # 通知列表
POST /api/notifications/:id/read        # 标记已读
POST /api/notifications/mark-all-read   # 全部已读
```

### 4.4 RFQ

```
GET    /api/rfqs                        # RFQ 列表
POST   /api/rfqs                        # 创建 RFQ
GET    /api/rfqs/:id                    # RFQ 详情
PUT    /api/rfqs/:id                    # 更新 RFQ
POST   /api/rfqs/:id/publish            # 发布 RFQ
GET    /api/rfqs/:id/comparison         # 报价对比
POST   /api/rfqs/:id/award              # 发起 award
POST   /api/rfqs/:id/approve            # 审批通过
POST   /api/rfqs/:id/return             # 退回（需原因）
```

### 4.5 报价 (Supplier 端)

```
GET    /api/supplier/rfqs               # 被邀请的 RFQ 列表
POST   /api/rfqs/:id/quotes             # 提交报价
POST   /api/quotes/:id/revise           # 修改报价
```

### 4.6 供应商准入

```
POST   /api/onboarding                  # 提交准入资料
GET    /api/onboarding/:id              # 查看资料
POST   /api/onboarding/:id/submit       # 提交审核
POST   /api/onboarding/:id/approve      # Buyer 批准
POST   /api/onboarding/:id/return       # Buyer 退回（需原因）
POST   /api/onboarding/:id/reject       # Buyer 拒绝（需原因）
```

### 4.7 PO

```
GET    /api/pos                         # PO 列表
POST   /api/pos                         # 创建 PO
GET    /api/pos/:id                     # PO 详情
POST   /api/pos/:id/confirm             # Supplier 确认
POST   /api/pos/:id/change-request      # Supplier 变更请求
POST   /api/pos/:id/review-change       # Buyer 处理变更
```

### 4.8 ASN

```
GET    /api/asns                        # ASN 列表
POST   /api/asns                        # 创建 ASN
GET    /api/asns/:id                    # ASN 详情
POST   /api/asns/:id/submit             # 提交 ASN
POST   /api/asns/:id/accept             # Buyer 接受
POST   /api/asns/:id/exception          # 登记异常
POST   /api/asns/:id/resolve            # 解决异常
```

### 4.9 Settlement

```
GET    /api/settlements                 # 结算单列表
POST   /api/settlements                 # 生成结算单
GET    /api/settlements/:id             # 结算单详情
POST   /api/settlements/:id/confirm     # Supplier 确认
POST   /api/settlements/:id/dispute     # Supplier 争议（需原因）
POST   /api/settlements/:id/resolve-dispute  # Buyer 解决争议
```

### 4.10 Invoice

```
POST   /api/settlements/:id/invoices            # 提交发票
POST   /api/invoices/:id/ocr-simulate           # 模拟 OCR
POST   /api/invoices/:id/approve                # 批准
POST   /api/invoices/:id/return                 # 退回（需原因）
POST   /api/invoices/:id/resubmit               # 重新提交
```

### 4.11 Admin

```
GET    /api/admin/users                 # 用户列表
POST   /api/admin/users                 # 新增用户
GET    /api/admin/configs               # 配置列表
PUT    /api/admin/configs/:key          # 更新配置
POST   /api/admin/demo-data/reset       # 重置演示数据
```

### 4.12 Audit

```
GET    /api/audit?object_type=&object_id=   # 操作历史查询
```

---

## 五、页面设计

### 5.1 Buyer Workspace

| 页面 | 路径 | 内容 |
|------|------|------|
| S2C Command Center | `/buyer.html` | KPI 卡片 + 待办任务列表 + 通知 |
| Supplier Lifecycle | `/buyer.html#suppliers` | 供应商列表 + 准入审核入口 |
| RFx & Sourcing | `/buyer.html#sourcing` | RFQ 列表 + 创建按钮 |
| RFQ Comparison | `/buyer.html#rfq-comparison/:id` | 报价对比页（新增） |
| Tender & Auction | `/buyer.html#tender` | 保留现有静态展示 |
| Contracts & Price Library | `/buyer.html#contracts` | 保留现有静态展示 |
| Order & Settlement | `/buyer.html#collaboration` | PO 列表 + ASN 列表 + Settlement 列表 |
| Supplier Performance | `/buyer.html#performance` | 保留现有静态展示 |
| Task Center | `/buyer.html#tasks` | 待办/逾期/已完成任务（新增） |
| Approval Inbox | `/buyer.html#approvals` | 统一审批入口（新增） |
| Configuration | `/buyer.html#admin` | Admin 配置入口 |

### 5.2 Supplier Portal

| 页面 | 路径 | 内容 |
|------|------|------|
| Supplier Workbench | `/supplier.html` | KPI 卡片 + 待办任务 + 通知 |
| Profile & Qualification | `/supplier.html#profile` | 公司资料 + 提交/修改入口 |
| Onboarding | `/supplier.html#onboarding` | 准入资料提交（新增） |
| RFQ Opportunities | `/supplier.html#opportunities` | 被邀请的 RFQ 列表 + 报价入口 |
| Auction Room | `/supplier.html#bidding` | 保留现有静态展示 |
| PO & Delivery | `/supplier.html#orders` | PO 确认 + ASN 创建 |
| Reconciliation & Invoice | `/supplier.html#settlement` | Settlement 确认 + 发票提交 |
| Task Center | `/supplier.html#tasks` | 待办/逾期/已完成任务（新增） |

### 5.3 Admin Console

| 页面 | 路径 | 内容 |
|------|------|------|
| System Dashboard | `/admin.html` | 统计卡片 + 系统状态 |
| User Management | `/admin.html#users` | 用户列表 + 新增 |
| Configuration | `/admin.html#config` | 系统参数配置 |
| Audit Logs | `/admin.html#audit` | 操作历史查询 |
| Demo Data Reset | `/admin.html#reset` | 一键重置 |

---

## 六、演示数据（初始化）

### 6.1 组织

| id | type | legal_name | short_name | status |
|----|------|------------|------------|--------|
| 1 | buyer | Aden Procurement Co., Ltd. | Aden Procurement | active |
| 2 | supplier | FreshFarm Distribution Co., Ltd. | FreshFarm | active |
| 3 | supplier | Jixiang Wonton Food Supply Co., Ltd. | Jixiang Wonton | active |
| 4 | supplier | SuXin Food / Su Xiao Liu Co., Ltd. | SuXin Food | active |
| 5 | supplier | GreenBox Packaging Co., Ltd. | GreenBox | active |
| 6 | supplier | North Star Logistics Co., Ltd. | North Star | active |

### 6.2 用户

| id | email | display_name | role | org_id |
|----|-------|--------------|------|--------|
| 1 | buyer@aden.demo | Aden Procurement | buyer | 1 |
| 2 | supplier1@aden.demo | FreshFarm Admin | supplier | 2 |
| 3 | supplier2@aden.demo | Jixiang Wonton Admin | supplier | 3 |
| 4 | supplier3@aden.demo | SuXin Food Admin | supplier | 4 |
| 5 | supplier4@aden.demo | GreenBox Admin | supplier | 5 |
| 6 | supplier5@aden.demo | North Star Admin | supplier | 6 |
| 7 | admin@aden.demo | System Admin | admin | 1 |

### 6.3 供应商准入状态

| 供应商 | 状态 | 说明 |
|--------|------|------|
| FreshFarm | Approved | 已准入，编号 V-001 |
| Jixiang Wonton | Approved | 已准入，编号 V-002 |
| SuXin Food | Approved | 已准入，编号 V-003 |
| GreenBox | Buyer Review | 已提交，待审核 |
| North Star | Draft | 仅注册，未提交资料 |

### 6.4 RFQ 状态分布

| 编号 | 标题 | 状态 | 说明 |
|------|------|------|------|
| RFQ-2605-018 | Ambient food ingredients | Award Approved | 已中标，SuXin Food |
| RFQ-2605-021 | Kitchen consumables | Comparison | 3家报价已提交，待比价 |
| RFQ-2606-004 | Packaging material | Published | 已发布，供应商报价中 |
| RFQ-2606-009 | Frozen product replenishment | Award Pending | 已发起 award，待审批 |
| RFQ-2606-015 | Catering equipment | Returned | 审批退回，需修改 |
| RFQ-2606-020 | Cleaning supplies | Draft | 草稿，未发布 |

### 6.5 PO 状态分布

| 编号 | 供应商 | 状态 | 说明 |
|------|--------|------|------|
| PO-45001288 | FreshFarm | Confirmed | 已确认，ASN 可创建 |
| PO-45001292 | SuXin Food | Change Requested | 供应商提出交期变更 |
| PO-45001304 | GreenBox | Pending Supplier | 待供应商确认 |
| PO-45001319 | Jixiang Wonton | Closed | 已完成收货结算 |
| PO-45001325 | FreshFarm | Confirmed | 已确认 |
| PO-45001330 | SuXin Food | Partially Confirmed | 部分确认 |
| PO-45001335 | North Star | Pending Supplier | 待确认 |
| PO-45001340 | GreenBox | Change Requested | 数量变更请求 |

### 6.6 ASN 状态分布

| 编号 | PO | 状态 | 说明 |
|------|-----|------|------|
| ASN-2605-001 | PO-45001288 | Accepted | 已正常接收 |
| ASN-2605-002 | PO-45001292 | Exception | 数量差异，待处理 |
| ASN-2605-003 | PO-45001325 | Submitted | 已提交，待 Buyer 审核 |
| ASN-2605-004 | PO-45001330 | Draft | 供应商草稿 |
| ASN-2605-005 | PO-45001335 | Accepted | 已正常接收 |

### 6.7 Settlement / Invoice 状态分布

| 编号 | 供应商 | 状态 | 说明 |
|------|--------|------|------|
| STM-2605-144 | Jixiang Wonton | Approved | 已批准，AP handover |
| STM-2605-151 | SuXin Food | Disputed | 供应商争议金额 |
| STM-2605-160 | FreshFarm | Invoice Submitted | 发票已提交，OCR 通过 |
| STM-2605-165 | GreenBox | Returned | 发票退回，税号不匹配 |
| STM-2606-010 | SuXin Food | Published | 刚发布，待确认 |
| STM-2606-015 | FreshFarm | Supplier Confirmed | 供应商已确认 |

### 6.8 任务分布

| 类型 | Buyer 端 | Supplier 端 | 说明 |
|------|----------|-------------|------|
| RFQ 报价 | - | 3 | 待报价 |
| RFQ 比价 | 1 | - | RFQ-2605-021 待比价 |
| RFQ 审批 | 1 | - | RFQ-2606-009 待审批 |
| 准入审核 | 1 | - | GreenBox 待审核 |
| PO 确认 | - | 3 | 待确认 |
| PO 变更审核 | 2 | - | 变更请求待处理 |
| ASN 审核 | 1 | - | 待审核 |
| ASN 异常 | - | 1 | 待处理 |
| Settlement 确认 | - | 2 | 待确认 |
| Settlement 争议 | 1 | - | 待处理 |
| Invoice 审核 | 2 | - | 待审批 |
| Invoice 修正 | - | 1 | 退回待修正 |

---

## 七、技术架构

```
aden-s2c-srm-prototype/
├── server/                          # 后端
│   ├── index.js                     # Express 入口
│   ├── db.js                        # SQLite 内存数据库
│   ├── auth.js                      # JWT 中间件
│   ├── seed.js                      # 演示数据初始化
│   └── routes/
│       ├── auth.js                  # 登录/注册
│       ├── users.js                 # 用户管理
│       ├── suppliers.js             # 供应商生命周期
│       ├── rfqs.js                  # RFQ 创建/报价/award
│       ├── quotes.js                # 供应商报价
│       ├── pos.js                   # PO 创建/确认
│       ├── asns.js                  # ASN 创建/异常
│       ├── settlements.js           # 结算/发票
│       ├── invoices.js              # 发票提交/审批
│       ├── approvals.js             # 通用审批
│       ├── tasks.js                 # 任务列表联动
│       ├── notifications.js         # 通知中心
│       ├── audit.js                 # 操作历史
│       └── admin.js                 # 管理员配置
├── public/                          # 前端静态资源
│   ├── index.html                   # 入口页
│   ├── login.html                   # 登录页
│   ├── buyer.html                   # Buyer Workspace
│   ├── supplier.html                # Supplier Portal
│   ├── admin.html                   # Admin Console
│   ├── styles.css                   # 样式
│   ├── script.js                    # 前端逻辑
│   └── assets/                      # 图片资源
├── package.json
├── vercel.json                      # Vercel 部署配置
└── README.md
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | HTML/CSS/JS | 保留现有 UI 风格 |
| 后端 | Node.js + Express | REST API |
| 数据库 | SQLite (内存模式) | 零配置，演示用 |
| 认证 | JWT + bcryptjs | 无状态认证 |
| 部署 | Vercel Serverless | 自动部署 |

---

## 八、状态机汇总

### 8.1 RFQ 状态机
```
Draft → Published → Quoting → Comparison → Award Pending → Returned → Award Approved → Closed
```

### 8.2 报价状态机
```
Invited → Draft → Submitted → Revised → Withdrawn
```

### 8.3 供应商准入状态机
```
Draft → Submitted → Buyer Review → Returned → Resubmitted → Approved
                              ↓
                           Rejected
```

### 8.4 PO 状态机
```
Pending Supplier → Confirmed → Change Requested → Buyer Review → Rejected → Closed
              ↓
           Partially Confirmed
```

### 8.5 ASN 状态机
```
Draft → Submitted → Buyer Review → Accepted → Closed
                    ↓
                 Exception → Resolved
```

### 8.6 Settlement 状态机
```
Draft → Published → Supplier Confirmed → Disputed → Buyer Review → Invoice Requested → Invoice Submitted → Returned → Approved → Closed
```

### 8.7 Invoice 状态机
```
Draft → Submitted → OCR Pending → OCR Passed → Under Review → Returned → Resubmitted → Approved → Rejected
```

### 8.8 审批状态机
```
Pending → Approved / Returned / Rejected / Cancelled
```

---

## 九、验收标准

1. [ ] Buyer 和 Supplier 可分别登录并进入独立工作台，菜单和数据按角色隔离
2. [ ] Buyer 创建 RFQ 并发布后，Supplier 端出现对应报价任务和通知
3. [ ] Supplier 提交报价后，Buyer 端 RFQ 比价页可看到报价并进行横向比较
4. [ ] 至少一个 RFQ award approval 可完成批准、退回、重新提交、再次批准的闭环
5. [ ] Supplier onboarding 可完成提交、Buyer 退回、Supplier 重提、Buyer 批准的闭环
6. [ ] PO confirmation 可完成供应商确认或变更请求，Buyer 端可处理
7. [ ] ASN 可从 PO 创建，并支持提交、Buyer 接收/异常登记
8. [ ] Settlement / Invoice 可完成 statement 发布、供应商确认/争议、发票提交、退回补正、最终批准
9. [ ] 任务列表、通知中心和操作历史在上述动作后自动变化
10. [ ] 管理员可重置演示数据

---

## 十、开发里程碑

| 阶段 | 周期 | 内容 |
|------|------|------|
| M1 | 2-3 天 | 数据库重构 + 认证 + 用户/组织模型 |
| M2 | 4-5 天 | RFQ 完整闭环 + 供应商准入 |
| M3 | 3-4 天 | PO + ASN 完整闭环 |
| M4 | 4-5 天 | Settlement / Invoice 完整闭环 |
| M5 | 3-4 天 | Task Center + Approval Inbox + 搜索筛选 + Audit |
| M6 | 2-3 天 | 演示数据完善 + 部署测试 |
