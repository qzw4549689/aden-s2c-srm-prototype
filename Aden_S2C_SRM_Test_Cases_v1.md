# Aden S2C SRM Prototype-App 测试用例

**版本**: v1.0  
**日期**: 2026-05-28  
**适用**: 浏览器端人工测试

---

## 测试环境

- **URL**: https://aden-s2c-srm-prototype.vercel.app
- **浏览器**: Chrome / Edge 最新版
- **分辨率**: 1920x1080 (或 1440x900)

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| Buyer | `buyer` | `demo123` |
| Supplier (FreshFarm) | `supplier1` | `demo123` |
| Supplier (Jixiang Wonton) | `supplier2` | `demo123` |
| Supplier (SuXin Food) | `supplier3` | `demo123` |
| Supplier (GreenBox) | `supplier4` | `demo123` |
| Supplier (North Star) | `supplier5` | `demo123` |
| Admin | `admin` | `demo123` |

---

## TC-01 登录与权限

### TC-01.1 Buyer 登录
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 打开入口页 `/` | 显示三个入口卡片：Buyer Workspace、Supplier Portal、Admin Console |
| 2 | 点击 "Buyer Workspace" | 跳转到登录页 `/login.html?role=buyer` |
| 3 | 输入用户名 `buyer`，密码 `demo123`，点击 Sign In | 登录成功，跳转到 `/buyer.html` |
| 4 | 查看左侧导航 | 显示 8 个菜单：S2C Command Center、Supplier Lifecycle、RFx & Sourcing、Tender & Auction、Contracts & Price Library、Order & Settlement、Supplier Performance、Configuration & Integration |
| 5 | 查看右上角 | 显示用户名 "Aden Procurement" |

### TC-01.2 Supplier 登录
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 打开入口页 `/` | 显示三个入口卡片 |
| 2 | 点击 "Supplier Portal" | 跳转到登录页 `/login.html?role=supplier` |
| 3 | 输入用户名 `supplier3`，密码 `demo123`，点击 Sign In | 登录成功，跳转到 `/supplier.html` |
| 4 | 查看左侧导航 | 显示 7 个菜单：Supplier Workbench、Profile & Qualification、RFQ / Tender Opportunities、Auction Room、PO & Delivery、Reconciliation & Invoice、Messages & Documents |
| 5 | 查看右上角 | 显示用户名 "SuXin Food Admin" |

### TC-01.3 Admin 登录
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 打开入口页 `/` | 显示三个入口卡片 |
| 2 | 点击 "Admin Console" | 跳转到登录页 `/login.html?role=admin` |
| 3 | 输入用户名 `admin`，密码 `demo123`，点击 Sign In | 登录成功，跳转到 `/admin.html` |
| 4 | 查看左侧导航 | 显示 4 个菜单：System Dashboard、User Management、Configuration、Audit Logs |

### TC-01.4 错误密码登录
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 在登录页输入用户名 `buyer`，密码 `wrongpassword` | 显示红色错误提示 "Invalid credentials" |
| 2 | 页面不跳转 | 停留在登录页 |

### TC-01.5 未登录直接访问
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 清除浏览器 localStorage | token 被清除 |
| 2 | 直接访问 `/buyer.html` | 自动跳转到 `/login.html` |
| 3 | 直接访问 `/supplier.html` | 自动跳转到 `/login.html` |
| 4 | 直接访问 `/admin.html` | 自动跳转到 `/login.html` |

### TC-01.6 角色隔离 - Supplier 不能访问 Buyer 页面
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 用 `supplier1` 登录 | 进入 Supplier Portal |
| 2 | 在地址栏手动输入 `/buyer.html` | 自动跳转到 `/supplier.html` 或显示无权限 |
| 3 | 用 `buyer` 登录 | 进入 Buyer Workspace |
| 4 | 在地址栏手动输入 `/supplier.html` | 自动跳转到 `/buyer.html` 或显示无权限 |

---

## TC-02 供应商准入 (Supplier Onboarding)

### TC-02.1 查看供应商列表
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录，点击左侧 "Supplier Lifecycle" | 显示供应商列表页面 |
| 2 | 查看列表 | 显示 5 家供应商：FreshFarm(Qualified)、Jixiang Wonton(Qualified)、SuXin Food(Qualified)、GreenBox(Buyer Review)、North Star(Potential) |
| 3 | 点击列表中的 "GreenBox Packaging" | 打开抽屉详情，显示准入资料 |
| 4 | 查看详情内容 | 显示：公司信息、联系人、税务信息、银行信息、证照附件、当前状态 "Buyer Review" |

### TC-02.2 Supplier 提交准入资料
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 用 `supplier5` (North Star) 登录 | 进入 Supplier Portal |
| 2 | 点击左侧 "Profile & Qualification" | 显示公司资料页面 |
| 3 | 点击 "Submit update" 或 "Submit for Review" | 弹出确认对话框 |
| 4 | 填写必填字段（公司名称、税号、联系人、银行信息），点击提交 | 提交成功，状态变为 "Submitted" |
| 5 | 查看通知中心 | 出现 "Supplier onboarding submitted" 通知 |

### TC-02.3 Buyer 审核准入 - 退回
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录，进入 "Supplier Lifecycle" | 显示供应商列表 |
| 2 | 找到状态为 "Submitted" 的供应商 | 如 North Star |
| 3 | 点击该供应商，打开抽屉详情 | 显示准入资料详情 |
| 4 | 点击 "Return" 按钮 | 弹出输入框要求填写退回原因 |
| 5 | 填写退回原因 "营业执照过期，请更新"，点击确认 | 状态变为 "Returned" |
| 6 | 查看任务列表 | 出现 "Review supplier onboarding" 任务已关闭 |
| 7 | 查看通知中心 | 出现退回通知 |

### TC-02.4 Supplier 重新提交
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 用被退回的 Supplier 登录 | 进入 Supplier Portal |
| 2 | 查看任务列表 | 出现 "Update onboarding profile" 任务 |
| 3 | 点击 "Profile & Qualification" | 显示资料页面，状态为 "Returned" |
| 4 | 修改资料（如更新营业执照），点击 "Resubmit" | 提交成功，状态变为 "Resubmitted" |
| 5 | 查看版本历史 | 显示版本 2，包含修改记录 |

### TC-02.5 Buyer 审核准入 - 批准
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录，进入 "Supplier Lifecycle" | 显示供应商列表 |
| 2 | 找到状态为 "Resubmitted" 的供应商 | 如 North Star |
| 3 | 点击该供应商，打开抽屉详情 | 显示准入资料详情 |
| 4 | 点击 "Approve" 按钮 | 弹出确认对话框 |
| 5 | 点击确认 | 状态变为 "Approved"，编号变为 V-xxx |
| 6 | 查看通知中心 | 出现 "Supplier approved" 通知 |
| 7 | 查看操作历史 | 记录：Submitted → Returned → Resubmitted → Approved |

---

## TC-03 RFQ 创建、报价与 Award

### TC-03.1 Buyer 创建 RFQ
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录，点击左侧 "RFx & Sourcing" | 显示 RFQ 列表页面 |
| 2 | 点击 "Create RFQ" 按钮 | 打开创建抽屉 |
| 3 | 填写 RFQ 信息：标题、品类、截止时间 | 字段正常输入 |
| 4 | 添加行项目：物料名称、数量、单位、交付日期 | 可添加多行 |
| 5 | 选择供应商邀请名单（勾选 FreshFarm、SuXin Food） | 显示已选供应商 |
| 6 | 点击 "Save Draft" | RFQ 状态为 "Draft"，保存成功 |
| 7 | 点击 "Publish" | RFQ 状态变为 "Published" |

### TC-03.2 Supplier 查看 RFQ 邀请
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 用 `supplier1` (FreshFarm) 登录 | 进入 Supplier Portal |
| 2 | 点击左侧 "RFQ / Tender Opportunities" | 显示 RFQ 列表 |
| 3 | 查看列表 | 出现新发布的 RFQ，状态 "Invited" |
| 4 | 查看任务列表 | 出现 "Submit quote for RFQ-xxx" 任务 |
| 5 | 查看通知中心 | 出现 "New RFQ invitation" 通知 |

### TC-03.3 Supplier 提交报价
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Supplier 登录，进入 "RFQ / Tender Opportunities" | 显示 RFQ 列表 |
| 2 | 点击目标 RFQ，打开详情 | 显示 RFQ 详情和报价表单 |
| 3 | 查看 RFQ 行项目 | 显示 Buyer 要求的物料明细 |
| 4 | 填写报价：每行输入单价、备注 | 自动计算行金额和总价 |
| 5 | 填写交期 "3 working days"、MOQ "100 kg" | 字段正常输入 |
| 6 | 点击 "Submit Quote" | 提交成功，状态变为 "Submitted" |
| 7 | 查看任务列表 | "Submit quote" 任务变为 "completed" |

### TC-03.4 Buyer 查看报价对比
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录，进入 "RFx & Sourcing" | 显示 RFQ 列表 |
| 2 | 找到状态为 "Quoting" 或 "Comparison" 的 RFQ | 如 RFQ-2605-021 |
| 3 | 点击 "View Comparison" 或进入 RFQ 详情 | 显示报价对比页 |
| 4 | 查看对比表格 | 横向显示各供应商报价：单价、总价、交期、MOQ、状态 |
| 5 | 查看最低价标记 | 最低价供应商行高亮显示 |
| 6 | 点击 "Mark as Recommended" 选择 SuXin Food | 该供应商标记为推荐 |

### TC-03.5 Buyer 发起 Award Approval
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 在报价对比页，点击 "Initiate Award" | 弹出确认对话框 |
| 2 | 确认推荐供应商和金额 | 显示推荐信息 |
| 3 | 点击 "Submit for Approval" | RFQ 状态变为 "Award Pending" |
| 4 | 查看任务列表 | 出现 "Approve RFQ award" 任务（分配给审批人） |
| 5 | 查看通知中心 | 出现 "Award approval requested" 通知 |

### TC-03.6 审批人退回 Award
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 审批人登录（或 Buyer 切换至审批视图） | 进入 Approval Inbox |
| 2 | 找到 "RFQ Award Approval" 待审批项 | 显示 RFQ 信息和推荐供应商 |
| 3 | 点击 "Return" | 弹出输入框要求填写退回原因 |
| 4 | 填写 "请补充供应商交货能力说明"，点击确认 | 状态变为 "Returned" |
| 5 | Buyer 查看该 RFQ | 状态为 "Returned"，显示退回原因 |

### TC-03.7 Buyer 修改后重新提交 Award
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 进入该 RFQ 详情 | 状态为 "Returned" |
| 2 | 修改备注或推荐说明 | 字段可编辑 |
| 3 | 点击 "Resubmit for Approval" | 状态变为 "Award Pending" |
| 4 | 查看审批历史 | 显示第一次提交和退回记录 |

### TC-03.8 审批人批准 Award
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 审批人进入 Approval Inbox | 显示该 RFQ 待审批 |
| 2 | 查看 RFQ 详情和推荐信息 | 显示完整信息 |
| 3 | 点击 "Approve" | 弹出确认对话框 |
| 4 | 点击确认 | 状态变为 "Award Approved" |
| 5 | 查看通知中心 | 出现 "RFQ award approved" 通知 |
| 6 | 中标 Supplier 查看通知 | 出现 "Congratulations! You have been awarded..." |
| 7 | 查看价格库 | 中标价格已记录 |

---

## TC-04 PO Confirmation

### TC-04.1 Buyer 创建 PO
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录，点击 "Order & Settlement" | 显示 PO 列表 |
| 2 | 点击 "Publish PO" | 打开创建抽屉 |
| 3 | 选择供应商（如 FreshFarm） | 显示供应商信息 |
| 4 | 添加行项目：物料、数量、单价、交付日期 | 可添加多行 |
| 5 | 选择站点 | 下拉选择 |
| 6 | 点击 "Publish" | PO 状态为 "Pending Supplier" |
| 7 | Supplier 查看任务列表 | 出现 "Confirm PO" 任务 |

### TC-04.2 Supplier 确认 PO
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Supplier 登录，点击 "PO & Delivery" | 显示 PO 列表 |
| 2 | 找到状态为 "Pending Supplier" 的 PO | 如新创建的 PO |
| 3 | 点击 PO，打开详情 | 显示 PO 信息和确认按钮 |
| 4 | 查看行项目 | 显示物料、数量、交付日期 |
| 5 | 点击 "Confirm" | 弹出确认对话框 |
| 6 | 点击确认 | PO 状态变为 "Confirmed" |
| 7 | Buyer 查看该 PO | 状态变为 "Confirmed" |

### TC-04.3 Supplier 提出变更请求
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Supplier 登录，进入 "PO & Delivery" | 显示 PO 列表 |
| 2 | 找到状态为 "Pending Supplier" 的 PO | 如 PO-45001292 |
| 3 | 点击 PO，打开详情 | 显示 PO 信息 |
| 4 | 点击 "Request Change" | 弹出变更表单 |
| 5 | 选择变更类型 "delivery"，填写建议交期 "2026-06-10" | 字段正常输入 |
| 6 | 填写变更原因 "原材料供应延迟" | 字段正常输入 |
| 7 | 点击 "Submit" | PO 状态变为 "Change Requested" |
| 8 | Buyer 查看任务列表 | 出现 "Review PO change request" 任务 |

### TC-04.4 Buyer 处理变更请求 - 批准
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录，进入 "Order & Settlement" | 显示 PO 列表 |
| 2 | 找到状态为 "Change Requested" 的 PO | 如 PO-45001292 |
| 3 | 点击 PO，查看变更详情 | 显示变更类型、建议交期、原因 |
| 4 | 点击 "Approve Change" | 弹出确认对话框 |
| 5 | 点击确认 | PO 状态变为 "Confirmed"，交期更新 |
| 6 | Supplier 查看该 PO | 状态已更新，显示新交期 |

### TC-04.5 Buyer 处理变更请求 - 拒绝
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 找到状态为 "Change Requested" 的 PO | 如 PO-45001340 |
| 2 | 点击 "Reject Change" | 弹出输入框要求填写拒绝原因 |
| 3 | 填写 "交期不可变更，请按原计划执行" | 字段正常输入 |
| 4 | 点击确认 | PO 状态变回 "Pending Supplier" |
| 5 | Supplier 查看该 PO | 状态变回 "Pending Supplier"，显示拒绝原因 |

---

## TC-05 ASN

### TC-05.1 Supplier 创建 ASN
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Supplier 登录，点击 "PO & Delivery" | 显示 PO 列表 |
| 2 | 找到状态为 "Confirmed" 的 PO | 如 PO-45001288 |
| 3 | 点击 "Create ASN" | 打开 ASN 创建抽屉 |
| 4 | 填写发运日期、预计到达、承运方、运单号 | 字段正常输入 |
| 5 | 填写箱数、托盘数 | 字段正常输入 |
| 6 | 添加 ASN 行项目：选择 PO 行、填写发运数量、批次号 | 可添加多行 |
| 7 | 点击 "Save Draft" | ASN 状态为 "Draft" |
| 8 | 点击 "Submit ASN" | ASN 状态变为 "Submitted" |
| 9 | Buyer 查看任务列表 | 出现 "Review ASN" 任务 |

### TC-05.2 Buyer 接受 ASN
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录，进入 "Order & Settlement" | 显示 ASN 列表 |
| 2 | 找到状态为 "Submitted" 的 ASN | 如 ASN-2605-003 |
| 3 | 点击 ASN，查看详情 | 显示发运信息、行项目 |
| 4 | 点击 "Accept" | ASN 状态变为 "Accepted" |
| 5 | Supplier 查看该 ASN | 状态变为 "Accepted" |

### TC-05.3 Buyer 登记 ASN 异常
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 找到状态为 "Submitted" 的 ASN | 如 ASN-2605-002 |
| 2 | 点击 ASN，查看详情 | 显示发运信息 |
| 3 | 点击 "Report Exception" | 弹出异常登记表单 |
| 4 | 选择异常类型 "quantity_diff" | 下拉选择 |
| 5 | 填写描述 "实际收货数量比 ASN 少 20 箱" | 字段正常输入 |
| 6 | 点击 "Submit" | ASN 状态变为 "Exception" |
| 7 | Supplier 查看任务列表 | 出现 "Resolve ASN exception" 任务 |
| 8 | Supplier 查看通知中心 | 出现 "ASN exception reported" 通知 |

### TC-05.4 Supplier 解决异常
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Supplier 登录，进入 "PO & Delivery" | 显示 ASN 列表 |
| 2 | 找到状态为 "Exception" 的 ASN | 如 ASN-2605-002 |
| 3 | 点击 ASN，查看异常详情 | 显示异常类型和描述 |
| 4 | 填写解决方案 "补发 20 箱，预计 6/5 到达" | 字段正常输入 |
| 5 | 点击 "Resolve" | ASN 状态变为 "Resolved" |
| 6 | Buyer 查看该 ASN | 状态变为 "Resolved"，显示解决方案 |

---

## TC-06 Settlement / Invoice

### TC-06.1 Buyer 生成 Settlement Statement
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录，点击 "Order & Settlement" | 显示 Settlement 列表 |
| 2 | 点击 "Generate Settlement" | 打开创建抽屉 |
| 3 | 选择供应商（如 SuXin Food） | 显示供应商信息 |
| 4 | 选择结算期间 "2026-05" | 字段正常选择 |
| 5 | 系统自动汇总该期间已接收的 PO/ASN 明细 | 显示明细列表 |
| 6 | 点击 "Publish" | Settlement 状态变为 "Published" |
| 7 | Supplier 查看任务列表 | 出现 "Confirm settlement" 任务 |

### TC-06.2 Supplier 确认 Settlement
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Supplier 登录，点击 "Reconciliation & Invoice" | 显示 Settlement 列表 |
| 2 | 找到状态为 "Published" 的 Settlement | 如 STM-2606-015 |
| 3 | 点击 Settlement，查看详情 | 显示明细列表和总金额 |
| 4 | 核对明细无误 | 数据显示正确 |
| 5 | 点击 "Confirm" | Settlement 状态变为 "Supplier Confirmed" |
| 6 | 状态变为 "Invoice Requested" | 系统提示可以提交发票 |

### TC-06.3 Supplier 发起争议
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Supplier 找到状态为 "Published" 的 Settlement | 如 STM-2605-151 |
| 2 | 点击 "Dispute" | 弹出争议表单 |
| 3 | 填写争议金额 "5000" | 字段正常输入 |
| 4 | 填写争议原因 "PO-45001330 实际收货数量与结算单不符" | 字段正常输入 |
| 5 | 点击 "Submit" | Settlement 状态变为 "Disputed" |
| 6 | Buyer 查看任务列表 | 出现 "Review settlement dispute" 任务 |

### TC-06.4 Buyer 解决争议
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 找到状态为 "Disputed" 的 Settlement | 如 STM-2605-151 |
| 2 | 点击 Settlement，查看争议详情 | 显示争议金额和原因 |
| 3 | 点击 "Resolve" | 弹出解决表单 |
| 4 | 选择处理方式 "Adjust amount"，填写调整后的金额 | 字段正常输入 |
| 5 | 点击 "Confirm" | Settlement 状态变为 "Invoice Requested" |
| 6 | Supplier 查看该 Settlement | 状态已更新，显示调整后的金额 |

### TC-06.5 Supplier 提交发票
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Supplier 找到状态为 "Invoice Requested" 的 Settlement | 如 STM-2605-160 |
| 2 | 点击 "Submit Invoice" | 打开发票提交表单 |
| 3 | 填写发票号、发票日期、含税金额、税额、税率 | 字段正常输入 |
| 4 | 上传发票附件（模拟） | 显示上传成功 |
| 5 | 点击 "Submit" | 发票状态变为 "Submitted"，进入 "OCR Pending" |
| 6 | 等待 2-3 秒（模拟 OCR） | OCR 状态变为 "Passed" 或 "Exception" |

### TC-06.6 OCR 异常处理
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Supplier 提交发票后 OCR 显示 "Exception" | 显示异常原因 "税号不匹配" |
| 2 | Supplier 查看该发票 | 状态为 "Exception"，显示原因 |
| 3 | Supplier 修改发票信息（如更正税号） | 字段可编辑 |
| 4 | 点击 "Resubmit" | 发票重新进入 "OCR Pending" |
| 5 | OCR 再次处理 | 状态变为 "Passed" |

### TC-06.7 Finance 审批发票 - 退回
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer/Finance 登录，进入 Approval Inbox | 显示待审批发票 |
| 2 | 找到状态为 "Under Review" 的发票 | 如 GreenBox 的发票 |
| 3 | 点击发票，查看详情 | 显示发票信息和 OCR 结果 |
| 4 | 点击 "Return" | 弹出输入框要求填写退回原因 |
| 5 | 填写 "税号与系统记录不符，请核对后重新提交" | 字段正常输入 |
| 6 | 点击确认 | 发票状态变为 "Returned" |
| 7 | Supplier 查看任务列表 | 出现 "Resubmit invoice" 任务 |

### TC-06.8 Supplier 重新提交发票
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Supplier 找到状态为 "Returned" 的发票 | 如 GreenBox 的发票 |
| 2 | 查看退回原因 | 显示 "税号与系统记录不符" |
| 3 | 修改发票信息（更正税号） | 字段可编辑 |
| 4 | 点击 "Resubmit" | 发票状态变为 "Submitted" |
| 5 | OCR 处理通过 | 状态变为 "OCR Passed" |
| 6 | Finance 再次审批 | 进入 "Under Review" |

### TC-06.9 Finance 审批发票 - 批准
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Finance 找到状态为 "Under Review" 的发票 | 如 FreshFarm 的发票 |
| 2 | 查看发票详情和 OCR 结果 | 显示 "OCR Passed" |
| 3 | 点击 "Approve" | 弹出确认对话框 |
| 4 | 点击确认 | 发票状态变为 "Approved" |
| 5 | Settlement 状态变为 "Closed" | 结算完成 |
| 6 | 显示 "AP handover / D365 ready" | 模拟 D365 集成状态 |

---

## TC-07 任务中心与通知

### TC-07.1 Buyer 查看任务列表
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录，首页或点击 "Task Center" | 显示任务列表 |
| 2 | 查看 "Open" 标签 | 显示待办任务：RFQ 比价、准入审核、PO 变更审核、ASN 审核、Settlement 争议、Invoice 审批 |
| 3 | 查看 "Overdue" 标签 | 显示逾期任务（如有） |
| 4 | 查看 "Completed" 标签 | 显示已完成任务 |
| 5 | 点击一个任务 | 跳转到对应的业务详情页 |

### TC-07.2 Supplier 查看任务列表
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Supplier 登录，首页或点击 "Task Center" | 显示任务列表 |
| 2 | 查看 "Open" 标签 | 显示待办任务：RFQ 报价、PO 确认、ASN 异常处理、Settlement 确认、Invoice 修正 |
| 3 | 点击一个任务 | 跳转到对应的业务详情页 |

### TC-07.3 通知中心
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 点击顶部通知铃铛图标 | 打开通知抽屉 |
| 2 | 查看未读通知 | 显示未读消息列表 |
| 3 | 点击一条通知 | 标记为已读，跳转到对应业务页 |
| 4 | 点击 "Mark all read" | 所有通知标记为已读 |
| 5 | 关闭抽屉后重新打开 | 未读数为 0 |

### TC-07.4 任务联动验证
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 发布一个新 RFQ | Supplier 端自动出现报价任务 |
| 2 | Supplier 提交报价 | Buyer 端自动出现比价任务 |
| 3 | Buyer 发起 award approval | 审批人端出现审批任务 |
| 4 | 审批人批准 | 中标 Supplier 端出现中标通知，Buyer 端任务关闭 |

---

## TC-08 操作历史 (Audit Log)

### TC-08.1 查看操作历史
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录，进入任意业务详情页 | 如 RFQ 详情 |
| 2 | 滚动到底部或点击 "History" 标签 | 显示操作历史 |
| 3 | 查看历史记录 | 按时间倒序显示：创建、发布、报价提交、award 发起、审批动作 |
| 4 | 每条记录显示 | 操作人、时间、动作、前后状态变化 |

### TC-08.2 Admin 查看全局 Audit Log
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Admin 登录，点击 "Audit Logs" | 显示全局操作历史 |
| 2 | 按业务类型筛选 | 如选择 "rfq"，只显示 RFQ 相关操作 |
| 3 | 按业务对象 ID 筛选 | 如输入 RFQ ID，只显示该 RFQ 的操作 |
| 4 | 查看详情 | 显示完整的 before/after JSON |

---

## TC-09 Admin 配置

### TC-09.1 查看系统统计
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Admin 登录，进入 "System Dashboard" | 显示统计卡片 |
| 2 | 查看卡片 | 显示：用户数、供应商数、RFQ 数、PO 数、ASN 数、Settlement 数 |

### TC-09.2 重置演示数据
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Admin 进入 "System Dashboard" | 显示 Danger Zone |
| 2 | 点击 "Reset All Data" | 弹出确认对话框 |
| 3 | 点击确认 | 显示 "Data reset successful" |
| 4 | 刷新页面 | 所有数据恢复为初始演示状态 |
| 5 | Buyer 查看 RFQ 列表 | 恢复为初始 6 个 RFQ |
| 6 | Supplier 查看任务列表 | 恢复为初始任务 |

### TC-09.3 修改系统配置
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Admin 进入 "Configuration" | 显示配置列表 |
| 2 | 找到 "settlement_cycle" 配置 | 当前值为 "monthly" |
| 3 | 修改为 "quarterly" | 字段可编辑 |
| 4 | 点击 "Save" | 保存成功，显示提示 |
| 5 | 刷新页面 | 配置值保持为 "quarterly" |

---

## TC-10 数据隔离

### TC-10.1 Supplier A 不能看到 Supplier B 的数据
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 用 `supplier1` (FreshFarm) 登录 | 进入 Supplier Portal |
| 2 | 进入 "RFQ / Tender Opportunities" | 只显示邀请给 FreshFarm 的 RFQ |
| 3 | 进入 "PO & Delivery" | 只显示发给 FreshFarm 的 PO |
| 4 | 进入 "Reconciliation & Invoice" | 只显示 FreshFarm 的 Settlement |
| 5 | 用 `supplier3` (SuXin Food) 登录 | 进入 Supplier Portal |
| 6 | 对比两个供应商的 RFQ/PO/Settlement 列表 | 数据完全不同 |

### TC-10.2 Buyer 可以看到全部数据
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录 | 进入 Buyer Workspace |
| 2 | 进入 "Supplier Lifecycle" | 显示全部 5 家供应商 |
| 3 | 进入 "RFx & Sourcing" | 显示全部 RFQ |
| 4 | 进入 "Order & Settlement" | 显示全部 PO、ASN、Settlement |

---

## TC-11 搜索与筛选

### TC-11.1 全局搜索
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 登录，在顶部搜索框输入 "FreshFarm" | 列表过滤，只显示包含 FreshFarm 的记录 |
| 2 | 输入 "RFQ-2605" | 过滤显示 RFQ-2605-018、RFQ-2605-021 |
| 3 | 清空搜索框 | 显示全部记录 |

### TC-11.2 状态筛选
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | Buyer 进入 "RFx & Sourcing" | 显示 RFQ 列表 |
| 2 | 点击状态筛选标签 "Draft" | 只显示 Draft 状态的 RFQ |
| 3 | 点击 "Published" | 只显示 Published 状态的 RFQ |
| 4 | 点击 "All" | 显示全部 RFQ |

---

## 测试完成 checklist

- [ ] TC-01 登录与权限（6 个用例）
- [ ] TC-02 供应商准入（5 个用例）
- [ ] TC-03 RFQ 创建、报价与 Award（8 个用例）
- [ ] TC-04 PO Confirmation（5 个用例）
- [ ] TC-05 ASN（4 个用例）
- [ ] TC-06 Settlement / Invoice（9 个用例）
- [ ] TC-07 任务中心与通知（4 个用例）
- [ ] TC-08 操作历史（2 个用例）
- [ ] TC-09 Admin 配置（3 个用例）
- [ ] TC-10 数据隔离（2 个用例）
- [ ] TC-11 搜索与筛选（2 个用例）

**总计: 50 个测试用例**
