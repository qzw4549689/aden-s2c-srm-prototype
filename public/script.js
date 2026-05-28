const workspace = document.body.dataset.workspace || "buyer";
const API_BASE = '';

let currentUser = null;
let authToken = localStorage.getItem('aden_token');

try {
  currentUser = JSON.parse(localStorage.getItem('aden_user') || '{}');
} catch (e) { currentUser = {}; }

async function api(path, opts = {}) {
  const url = `${API_BASE}/api${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
      ...(opts.headers || {})
    }
  });
  if (res.status === 401) {
    localStorage.removeItem('aden_token');
    localStorage.removeItem('aden_user');
    window.location.href = './login.html';
    return;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const nav = {
  buyer: [
    ["command", "dashboard", "S2C Command Center"],
    ["suppliers", "users", "Supplier Lifecycle"],
    ["sourcing", "search", "RFx & Sourcing"],
    ["tender", "gavel", "Tender & Auction"],
    ["contracts", "file", "Contracts & Price Library"],
    ["collaboration", "truck", "Order & Settlement"],
    ["performance", "chart", "Supplier Performance"],
    ["admin", "settings", "Configuration & Integration"]
  ],
  supplier: [
    ["portalHome", "home", "Supplier Workbench"],
    ["profile", "id", "Profile & Qualification"],
    ["opportunities", "mail", "RFQ / Tender Opportunities"],
    ["bidding", "timer", "Auction Room"],
    ["orders", "package", "PO & Delivery"],
    ["settlement", "receipt", "Reconciliation & Invoice"],
    ["messages", "folder", "Messages & Documents"]
  ],
  admin: [
    ["dashboard", "dashboard", "System Dashboard"],
    ["users", "users", "User Management"],
    ["config", "settings", "Configuration"],
    ["audit", "file", "Audit Logs"]
  ]
};

const state = {
  page: workspace === "buyer" ? "command" : workspace === "admin" ? "dashboard" : "portalHome",
  tab: "all"
};

let searchToastTimer;
let cachedData = {};

const pageTitles = {
  command: "S2C Command Center",
  suppliers: "Supplier Lifecycle",
  sourcing: "RFx & Sourcing",
  tender: "Tender & Auction",
  contracts: "Contracts & Price Library",
  collaboration: "Order & Settlement Collaboration",
  performance: "Supplier Performance",
  admin: "Configuration & Integration",
  portalHome: "Supplier Workbench",
  profile: "Profile & Qualification",
  opportunities: "RFQ / Tender Opportunities",
  bidding: "Auction Room",
  orders: "PO & Delivery Collaboration",
  settlement: "Reconciliation & Invoice",
  messages: "Messages & Documents",
  dashboard: "System Dashboard",
  users: "User Management",
  config: "Configuration",
  audit: "Audit Logs"
};

const primaryActions = {
  command: "Create RFQ",
  suppliers: "Register Supplier",
  sourcing: "Create RFQ",
  tender: "Create Tender",
  contracts: "New Contract",
  collaboration: "Publish PO",
  performance: "Launch Review",
  admin: "Configure API",
  portalHome: "Open Tasks",
  profile: "Update Profile",
  opportunities: "Prepare Response",
  bidding: "Submit Bid",
  orders: "Create ASN",
  settlement: "Confirm Statement",
  messages: "Upload Document",
  dashboard: "Reset Data",
  users: "Add User",
  config: "Add Config",
  audit: "Export Logs"
};

function badgeClass(status) {
  const value = String(status).toLowerCase();
  if (value.includes("active") || value.includes("qualified") || value.includes("confirmed") || value.includes("passed") || value.includes("open") || value.includes("approved")) return "green";
  if (value.includes("review") || value.includes("approval") || value.includes("signature") || value.includes("pending") || value.includes("planned") || value.includes("soon")) return "orange";
  if (value.includes("draft") || value.includes("trial") || value.includes("potential") || value.includes("design")) return "blue";
  if (value.includes("exception") || value.includes("expiry") || value.includes("hold") || value.includes("mismatch") || value.includes("overdue") || value.includes("rejected") || value.includes("disputed")) return "red";
  return "gray";
}

function panel(title, body, action = "") {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>${title}</h2>
        ${action}
      </div>
      <div class="panel-body">${body}</div>
    </section>
  `;
}

function kpi(label, value, note, pct) {
  return `
    <div class="panel kpi interactive" data-kpi="${label}">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${note}</small>
      <div class="progress"><i style="width:${pct}%"></i></div>
    </div>
  `;
}

function table(headers, rows, type) {
  if (!rows || rows.length === 0) {
    return `<div class="empty">No records found</div>`;
  }
  return `
    <table class="table" data-table="${type}">
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map((row) => `
          <tr data-record="${row[0] || row.id}" data-type="${type}">
            ${row.map((cell, index) => {
              if (index === 0) return `<td><div class="record-title">${cell}</div><div class="record-sub">Click to open details</div></td>`;
              if (index === 3 || String(cell).match(/Qualified|Trial|Potential|Open|Draft|review|approval|Signature|Active|Confirmed|planned|Passed|Exception|Expiry|Approved|Rejected|Disputed|Shipped|Preparing/i)) {
                return `<td><span class="badge ${badgeClass(cell)}">${cell}</span></td>`;
              }
              return `<td>${cell}</td>`;
            }).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function workflow(steps) {
  return `<div class="workflow">${steps.map((s) => `
    <div class="step interactive" data-step="${s[0]}">
      <strong><span class="status-dot"></span>${s[0]}</strong>
      <p>${s[1]}</p>
    </div>
  `).join("")}</div>`;
}

function tabs(items, active = "all") {
  return `<div class="tabs">${items.map((item) => `<button class="tab-btn ${item[0] === active ? "active" : ""}" type="button" data-tab="${item[0]}">${item[1]}</button>`).join("")}</div>`;
}

function field(label, value, type = "text", name = "") {
  const nm = name || label.toLowerCase().replace(/\s+/g, '_');
  if (type === "textarea") return `<div class="field"><label>${label}</label><textarea name="${nm}">${value || ""}</textarea></div>`;
  if (type === "select") return `<div class="field"><label>${label}</label><select name="${nm}"><option>${value}</option></select></div>`;
  return `<div class="field"><label>${label}</label><input name="${nm}" value="${value || ""}" type="${type}" /></div>`;
}

function bar(label, pct) {
  return `<div class="bar-row interactive" data-kpi="${label} performance"><span>${label}</span><div class="bar-track"><i style="width:${pct}%"></i></div><strong>${pct}</strong></div>`;
}

function timeline(who, text, time) {
  return `<div class="timeline-item"><i></i><div><strong>${who}</strong><span>${text}<br>${time}</span></div></div>`;
}

// ===================== BUYER PAGES =====================

async function commandPage() {
  try {
    const data = await api('/dashboard/buyer');
    const k = data.kpi || {};
    return `
      <div class="grid-4">
        ${kpi("Active RFx events", k.active_rfx || 0, "Events requiring attention", 72)}
        ${kpi("Qualified suppliers", k.qualified_suppliers || 0, "Food supplier references", 88)}
        ${kpi("Expiring contracts", k.expiring_contracts || 0, "Expiry alerts routed", 48)}
        ${kpi("Pending tasks", k.pending_tasks || 0, "Tasks assigned to you", 64)}
      </div>
      ${panel("End-to-end S2C operating flow", workflow([
        ["Spend & demand", "Category demand and purchase needs are consolidated before sourcing."],
        ["Supplier discovery", "Registration, qualification, credit and duplicate checks are governed in SRM."],
        ["RFx / tender", "Public RFQ, invited RFQ, tender, auction and multi-round negotiation are supported."],
        ["Award & contract", "Award approval, contract drafting, signature tracking and price library are controlled."],
        ["Collaboration", "PO confirmation, delivery, reconciliation and invoice preparation are handled in portal."]
      ]))}
      <div class="split">
        ${panel("Current sourcing pipeline", table(["Record", "Scope", "Status", "Suppliers", "Due date", "Round"],
          (data.rfqs || []).map(r => [r.code, r.scope, r.status, r.suppliers_count, r.due_date, r.round]), "rfq"))}
        ${panel("Control focus", `
          <div class="cards-list">
            <div class="mini-card"><div><strong>Portal-based supplier participation</strong><p>External suppliers use portal workflows for registration, quotation, bidding, PO confirmation and settlement tasks.</p></div><span class="badge green">Access</span></div>
            <div class="mini-card"><div><strong>ERP handoff ready</strong><p>Approved supplier, price, PO status and settlement records are prepared for D365 processing.</p></div><span class="badge blue">D365</span></div>
            <div class="mini-card"><div><strong>Food service reference path</strong><p>Food-industry supplier collaboration patterns can be reused for Aden site operations.</p></div><span class="badge orange">Industry</span></div>
          </div>
        `)}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error loading dashboard: ${e.message}</div>`;
  }
}

async function suppliersPage() {
  try {
    const suppliers = await api('/suppliers');
    return `
      ${panel("Supplier admission and lifecycle governance", workflow([
        ["Registration", "Supplier self-registration or buyer invitation with business, tax and license details."],
        ["Qualification", "Document review, duplicate check, category mapping and risk classification."],
        ["Trial supplier", "Trial trading, sample review, site audit and performance tracking."],
        ["Qualified supplier", "Approved vendor master data is synchronized to D365 where required."],
        ["Ongoing control", "Review, correction, blacklist, elimination and re-qualification are managed."]
      ]))}
      <div class="split">
        ${panel("Supplier master list", table(["Supplier ID", "Supplier", "Category", "Status", "Score", "Location", "Integration"],
          suppliers.map(s => [s.code, s.name, s.category, s.status, s.score, s.location, s.integration_status]), "supplier"),
          `<button class="secondary-btn" data-open="supplier" type="button">Add supplier</button>`)}
        ${panel("Qualification checklist", `
          <div class="cards-list">
            <div class="mini-card"><div><strong>Business license and tax profile</strong><p>Captured at registration and validated before supplier activation.</p></div><span class="badge green">Complete</span></div>
            <div class="mini-card"><div><strong>Food safety certificate</strong><p>Mandatory for food ingredient and prepared-food categories.</p></div><span class="badge orange">Review</span></div>
            <div class="mini-card"><div><strong>Bank and payment profile</strong><p>Maintained with maker-checker approval before D365 vendor sync.</p></div><span class="badge blue">Controlled</span></div>
            <div class="mini-card"><div><strong>Site audit</strong><p>Audit findings and corrective actions are retained in supplier history.</p></div><span class="badge gray">Optional</span></div>
          </div>
        `)}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function sourcingPage() {
  try {
    const rfqs = await api('/rfqs');
    return `
      <div class="split">
        ${panel("RFQ workbench", `
          ${tabs([["all", "All RFQs"], ["draft", "Draft"], ["open", "Open"], ["compare", "Comparison"], ["award", "Award approval"]], state.tab)}
          <div class="spacer"></div>
          ${table(["RFQ", "Scope", "Status", "Suppliers", "Due date", "Round"],
            rfqs.map(r => [r.code, r.scope, r.status, r.suppliers_count, r.due_date, r.round]), "rfq")}
        `, `<button class="secondary-btn" data-open="rfq" type="button">New RFQ</button>`)}
        ${panel("Create RFQ", `
          <div class="form-grid">
            ${field("Category", "Food ingredients", "select")}
            ${field("Sourcing method", "Invited RFQ", "select")}
            ${field("Response deadline", "2026-06-03")}
            ${field("Commercial round", "Round 2")}
            ${field("Material / service scope", "Ambient food ingredients", "textarea")}
            ${field("Supplier invite list", "FreshFarm, Jixiang Wonton, SuXin Food", "textarea")}
          </div>
          <div class="drawer-actions page-actions">
            <button class="primary-btn" data-action="create-rfq" type="button">Send to suppliers</button>
            <button class="secondary-btn" type="button">Save draft</button>
          </div>
        `)}
      </div>
      ${panel("Quote comparison and award control", `
        <div class="comparison-grid">
          <div class="compare-card best"><span>Best evaluated offer</span><strong>SuXin Food / Su Xiao Liu</strong><p>Lowest landed cost, stable quality rating and fastest confirmed delivery window.</p></div>
          <div class="compare-card"><span>FreshFarm Distribution</span><strong>CNY 184,260</strong><p>Strong delivery reliability. Commercial rank 2.</p></div>
          <div class="compare-card"><span>Jixiang Wonton Food Supply</span><strong>CNY 191,800</strong><p>Preferred frozen-food reference supplier. Commercial rank 3.</p></div>
        </div>
      `)}
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function tenderPage() {
  try {
    const auctions = await api('/dashboard/buyer').then(d => d.auctions || []);
    return `
      ${panel("Tender, clarification and online auction flow", workflow([
        ["Tender notice", "Public or invited tender is published with qualification rules and schedule."],
        ["Pre-qualification", "Supplier documents are reviewed before technical and commercial rounds."],
        ["Clarification", "Question handling and buyer replies are recorded with audit trail."],
        ["Bid opening", "Password opening, expert evaluation and scoring are controlled online."],
        ["Award notice", "Award result, approval and contract initiation are generated from SRM."]
      ]))}
      <div class="auction-board">
        ${panel("Live auction room", `
          <div class="auction-clock">
            <span class="eyebrow">Current round closes in</span>
            <strong>00:18:42</strong>
            <p>Reverse auction for packaging materials. Minimum decrement CNY 500.</p>
          </div>
          <div class="metric-row">
            <div class="metric"><span>Leading bid</span><strong>CNY 328,000</strong></div>
            <div class="metric"><span>Qualified bidders</span><strong>5</strong></div>
            <div class="metric"><span>Bid events</span><strong>27</strong></div>
          </div>
        `)}
        ${panel("Bid ranking", table(["Bidder", "Supplier", "Status", "Rank", "Bid amount", "Last update"], [
          ["BID-01", "GreenBox Packaging", "Open", "1", "CNY 328,000", "1 min ago"],
          ["BID-02", "FreshFarm Distribution", "Open", "2", "CNY 332,500", "3 min ago"],
          ["BID-03", "North Star Logistics", "Review", "3", "CNY 338,000", "5 min ago"]
        ], "bid"))}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function contractsPage() {
  try {
    const contracts = await api('/contracts');
    const prices = await api('/contracts/prices');
    return `
      <div class="split">
        ${panel("Contract repository", table(["Contract", "Supplier", "Type", "Status", "Valid until", "Price status"],
          contracts.map(c => [c.code, c.supplier_name, c.type, c.status, c.valid_until, c.price_status]), "contract"),
          `<button class="secondary-btn" data-open="contract" type="button">New contract</button>`)}
        ${panel("Contract drafting", `
          <div class="form-grid">
            ${field("Template", "Food supply frame agreement", "select")}
            ${field("Contract owner", "Category Manager - Food")}
            ${field("Payment terms", "Monthly settlement + AP invoice")}
            ${field("Renewal alert", "60 days before expiry")}
            ${field("Key clauses", "Quality, delivery window, site exception handling, invoice requirements", "textarea")}
            ${field("Approval route", "Legal -> Procurement -> Finance", "textarea")}
          </div>
        `)}
      </div>
      ${panel("Price library and D365 catalog integration", `
        ${table(["Price item", "Supplier", "Category", "Status", "Unit price", "ERP action"],
          prices.map(p => [p.code, p.supplier_name, p.category, p.status, p.unit_price, p.erp_action]), "price")}
      `)}
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function collaborationPage() {
  try {
    const orders = await api('/orders');
    const settlements = await api('/settlements');
    return `
      ${panel("Supplier collaboration process", workflow([
        ["PO publish", "Formal PO from D365 is exposed to supplier portal for confirmation."],
        ["PO confirmation", "Supplier confirms quantity, date and exceptions before delivery."],
        ["Delivery / ASN", "Packing list, logistics information and labels are prepared in portal."],
        ["Receipt exception", "Site receipt differences are visible for supplier and buyer follow-up."],
        ["Settlement", "Monthly statement is confirmed before original invoice submission."]
      ]))}
      <div class="split">
        ${panel("PO and delivery collaboration", table(["PO", "Supplier", "Status", "Delivery date", "ASN", "Next step"],
          orders.map(o => [o.code, o.supplier_name, o.status, o.delivery_date, o.asn_count, o.next_step]), "order"))}
        ${panel("Settlement and invoice readiness", table(["Record", "Supplier", "Type", "Status", "Amount", "Next step"],
          settlements.map(s => [s.code, s.supplier_name, s.type, s.status, s.amount, s.next_step]), "settlement"))}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function performancePage() {
  try {
    const capas = await api('/dashboard/buyer').then(d => d.capas || []);
    return `
      <div class="grid-3">
        ${kpi("Average supplier score", "87.4", "Quality, delivery, service and compliance weighted score", 86)}
        ${kpi("On-time delivery", "94.1%", "Measured against confirmed delivery window", 94)}
        ${kpi("Open corrective actions", "9", "3 actions are overdue and escalated", 36)}
      </div>
      <div class="grid-2">
        ${panel("Performance by category", `
          <div class="chart-bars">
            ${bar("Food ingredients", 92)}
            ${bar("Prepared food", 89)}
            ${bar("Packaging", 81)}
            ${bar("Logistics service", 76)}
            ${bar("Consumables", 84)}
          </div>
        `)}
        ${panel("Corrective action tracking", table(["Action", "Supplier", "Status", "Owner", "Due date", "Issue"], [
          ["CAPA-2605-019", "GreenBox Packaging", "Review", "QA Lead", "Jun 04", "Label mismatch"],
          ["CAPA-2605-027", "North Star Logistics", "Exception", "Logistics Lead", "Jun 01", "Late POD return"],
          ["CAPA-2606-003", "FreshFarm Distribution", "Open", "Category Owner", "Jun 12", "Temperature variance"]
        ], "capa"))}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function adminPage() {
  try {
    const configs = await api('/admin/config');
    return `
      ${panel("Integration and control architecture", `
        <div class="integration-map">
          <div class="system-card">DeKeYiCai SRM<br><span>Supplier, sourcing, contract and collaboration workspace</span></div>
          <div class="flow-line">Vendor, material, award, price, PO status, settlement</div>
          <div class="system-card accent">Integration Layer<br><span>API, queue, retry, monitoring, audit log</span></div>
          <div class="flow-line">Vendor master, PO, receipt, AP invoice, payment status</div>
          <div class="system-card">D365 F&O<br><span>ERP processing for PO, inventory, AP and finance</span></div>
        </div>
      `)}
      <div class="grid-3">
        ${panel("API catalog", `<div class="cards-list">
          <div class="mini-card"><div><strong>Supplier master</strong><p>SRM approved supplier to D365 vendor master.</p></div><span class="badge green">Active</span></div>
          <div class="mini-card"><div><strong>Price library</strong><p>Approved contract price to D365 catalog reference.</p></div><span class="badge green">Active</span></div>
          <div class="mini-card"><div><strong>PO collaboration</strong><p>D365 PO to SRM portal, confirmation status back.</p></div><span class="badge orange">Design</span></div>
        </div>`)}
        ${panel("Portal configuration", `<div class="cards-list">
          <div class="mini-card"><div><strong>Announcements</strong><p>Buyer notices, tender notices and supplier messages.</p></div><span class="badge blue">Portal</span></div>
          <div class="mini-card"><div><strong>Document templates</strong><p>RFQ, tender, contract and certificate templates.</p></div><span class="badge blue">Template</span></div>
          <div class="mini-card"><div><strong>Roles and permissions</strong><p>Category owner, sourcing manager, QA, finance and supplier users.</p></div><span class="badge blue">RBAC</span></div>
        </div>`)}
        ${panel("Monitoring", `<div class="cards-list">
          <div class="mini-card"><div><strong>Interface success rate</strong><p>99.6% over the last 24 hours.</p></div><span class="badge green">Healthy</span></div>
          <div class="mini-card"><div><strong>Queue backlog</strong><p>7 messages waiting, oldest 3 minutes.</p></div><span class="badge orange">Watch</span></div>
          <div class="mini-card"><div><strong>Audit log</strong><p>Payload trace and reconciliation evidence retained.</p></div><span class="badge gray">Governed</span></div>
        </div>`)}
      </div>
      ${panel("System Configuration", `
        <table class="config-table">
          <thead><tr><th>Key</th><th>Value</th><th>Category</th><th>Action</th></tr></thead>
          <tbody>
            ${configs.map(c => `
              <tr>
                <td>${c.key}</td>
                <td><input value="${c.value}" data-config-id="${c.id}" class="config-input" /></td>
                <td>${c.category}</td>
                <td><button class="secondary-btn config-save" data-config-id="${c.id}" type="button">Save</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `)}
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

// ===================== SUPPLIER PAGES =====================

async function supplierHomePage() {
  try {
    const data = await api('/dashboard/supplier');
    const k = data.kpi || {};
    return `
      <div class="grid-4">
        ${kpi("Open invitations", k.open_invitations || 0, "RFQ, tender and auction opportunities", 64)}
        ${kpi("POs to confirm", k.pos_to_confirm || 0, "Confirm quantity and delivery window", 52)}
        ${kpi("Statements to approve", k.statements_to_approve || 0, "Monthly billing settlement", 40)}
        ${kpi("Pending tasks", k.pending_tasks || 0, "Tasks requiring your action", 72)}
      </div>
      <div class="split">
        ${panel("Priority task list", `
          <div class="cards-list">
            ${(data.tasks || []).slice(0, 5).map(t => `
              <div class="mini-card"><div><strong>${t.title}</strong><p>Due: ${t.due_date || 'N/A'}</p></div><span class="badge ${badgeClass(t.priority === 'high' ? 'Due soon' : 'Action')}">${t.priority}</span></div>
            `).join('') || '<div class="empty">No pending tasks</div>'}
          </div>
        `)}
        ${panel("Supplier portal journey", `
          <div class="cards-list">
            <div class="mini-card"><div><strong>1. Profile</strong><p>Maintain company, tax, bank, contact and certification data.</p></div><span class="badge blue">Master</span></div>
            <div class="mini-card"><div><strong>2. Opportunities</strong><p>Receive RFQ, tender and auction invitations from Aden.</p></div><span class="badge orange">Sourcing</span></div>
            <div class="mini-card"><div><strong>3. Quotation</strong><p>Submit price, lead time, documents and clarification replies.</p></div><span class="badge green">Response</span></div>
            <div class="mini-card"><div><strong>4. PO / ASN</strong><p>Confirm PO, delivery plan, packing list and shipment details.</p></div><span class="badge blue">Delivery</span></div>
            <div class="mini-card"><div><strong>5. Settlement</strong><p>Approve statement, submit invoice data and track payment status.</p></div><span class="badge gray">Finance</span></div>
          </div>
        `)}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function profilePage() {
  return `
    <div class="split">
      ${panel("Company profile", `
        <div class="form-grid">
          ${field("Legal entity", currentUser?.name || "SuXin Food Co., Ltd.")}
          ${field("Supplier category", "Prepared food", "select")}
          ${field("Tax registration number", "9132************")}
          ${field("Primary contact", "Linda Chen")}
          ${field("Bank account", "**** **** **** 8128")}
          ${field("Delivery coverage", "Shanghai, Jiangsu, Zhejiang", "textarea")}
        </div>
        <div class="drawer-actions page-actions">
          <button class="primary-btn" data-action="update-profile" type="button">Submit update</button>
          <button class="secondary-btn" type="button">Save draft</button>
        </div>
      `)}
      ${panel("Qualification status", `
        <div class="cards-list">
          <div class="mini-card"><div><strong>Business license</strong><p>Valid until 2030-12-31</p></div><span class="badge green">Approved</span></div>
          <div class="mini-card"><div><strong>Food safety certificate</strong><p>Renewal reminder configured.</p></div><span class="badge orange">Expires soon</span></div>
          <div class="mini-card"><div><strong>Bank profile</strong><p>Last buyer approval: 2026-04-18</p></div><span class="badge green">Approved</span></div>
          <div class="mini-card"><div><strong>Site audit</strong><p>Last score: 91 / 100</p></div><span class="badge green">Passed</span></div>
        </div>
      `)}
    </div>
  `;
}

async function opportunitiesPage() {
  try {
    const data = await api('/dashboard/supplier');
    return `
      <div class="split">
        ${panel("Available opportunities", table(["Event", "Scope", "Status", "Buyer", "Due date", "Round"],
          (data.opportunities || []).map(o => [o.code, o.scope, o.status, o.buyer, o.due_date, o.round]), "opportunity"))}
        ${panel("Quotation response", `
          <div class="form-grid">
            ${field("Unit price", "18.40")}
            ${field("Currency", "CNY", "select")}
            ${field("Lead time", "3 working days")}
            ${field("Minimum order quantity", "100 kg")}
            ${field("Commercial notes", "Price includes delivery to Aden designated site.", "textarea")}
            ${field("Attachments", "Product spec, certificate, quotation file")}
          </div>
          <div class="drawer-actions page-actions">
            <button class="primary-btn" data-action="submit-quote" type="button">Submit response</button>
            <button class="secondary-btn" type="button">Ask clarification</button>
          </div>
        `)}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function biddingPage() {
  return `
    <div class="auction-board">
      ${panel("Auction submission", `
        <div class="auction-clock">
          <span class="eyebrow">AUC-2606-004 closes in</span>
          <strong>00:18:42</strong>
          <p>Your current rank: 2. Minimum next bid: CNY 327,500.</p>
        </div>
        <div class="form-grid auction-form">
          ${field("Your next bid", "327500")}
          ${field("Delivery commitment", "5 working days")}
        </div>
        <div class="drawer-actions page-actions">
          <button class="primary-btn" data-action="submit-bid" type="button">Submit bid</button>
          <button class="secondary-btn" type="button">View rules</button>
        </div>
      `)}
      ${panel("Live bid history", table(["Bid", "Supplier alias", "Status", "Rank", "Bid amount", "Time"], [
        ["BID-118", "Supplier A", "Open", "1", "CNY 328,000", "10:21"],
        ["BID-117", "Your company", "Open", "2", "CNY 332,500", "10:19"],
        ["BID-116", "Supplier C", "Open", "3", "CNY 338,000", "10:18"]
      ], "bid"))}
    </div>
  `;
}

async function ordersPage() {
  try {
    const orders = await api('/orders');
    return `
      ${panel("PO confirmation and delivery collaboration", workflow([
        ["PO received", "Review D365 formal PO exposed in the supplier portal."],
        ["Confirm", "Accept or propose delivery date and quantity adjustment."],
        ["ASN", "Create shipment notice, packing list, label and logistics information."],
        ["Receipt", "View site receipt and exception feedback from Aden."],
        ["Reconcile", "Accepted receipts are included in monthly settlement statement."]
      ]))}
      <div class="split">
        ${panel("PO list", table(["PO", "Buyer", "Status", "Delivery date", "ASN", "Next step"],
          orders.map(o => [o.code, "Aden Procurement", o.status, o.delivery_date, o.asn_count, o.next_step]), "order"))}
        ${panel("Create ASN", `
          <div class="form-grid">
            ${field("PO number", "PO-45001292")}
            ${field("Shipment date", "2026-06-05")}
            ${field("Carrier", "SF Express cold chain")}
            ${field("Vehicle / tracking", "SH-A8128")}
            ${field("Packing list", "2 pallets, 80 cartons", "textarea")}
            ${field("Label template", "Aden site receiving label", "select")}
          </div>
          <div class="drawer-actions page-actions">
            <button class="primary-btn" data-action="create-asn" type="button">Send ASN</button>
            <button class="secondary-btn" type="button">Print labels</button>
          </div>
        `)}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function settlementPage() {
  try {
    const settlements = await api('/settlements');
    return `
      <div class="split">
        ${panel("Monthly settlement and invoice control", table(["Record", "Buyer", "Type", "Status", "Amount", "Next step"],
          settlements.map(s => [s.code, "Aden Finance / Procurement", s.type, s.status, s.amount, s.next_step]), "settlement"))}
        ${panel("Invoice submission", `
          <div class="form-grid">
            ${field("Settlement statement", "STM-2605-144")}
            ${field("Invoice type", "VAT special invoice", "select")}
            ${field("Invoice amount", "184260")}
            ${field("Tax amount", "11055.60")}
            ${field("OCR and verification", "Passed after upload")}
            ${field("Notes", "Original invoice submission after Aden statement confirmation.", "textarea")}
          </div>
          <div class="drawer-actions page-actions">
            <button class="primary-btn" data-action="upload-invoice" type="button">Upload invoice</button>
            <button class="secondary-btn" type="button">Download statement</button>
          </div>
        `)}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function messagesPage() {
  try {
    const docs = await api('/dashboard/supplier').then(d => d.documents || []);
    return `
      <div class="grid-2">
        ${panel("Messages", `
          <div class="timeline">
            ${timeline("Aden Procurement", "Clarification response for RFQ-2605-018 has been published.", "Today 09:42")}
            ${timeline("System", "PO-45001292 ASN is due in 24 hours.", "Today 08:10")}
            ${timeline("Aden Finance", "STM-2605-144 is ready for supplier confirmation.", "Yesterday 16:35")}
          </div>
        `)}
        ${panel("Document center", table(["Document", "Related record", "Status", "Owner", "Updated", "Action"], [
          ["Food safety certificate", "Supplier profile", "Review", "Supplier", "May 27", "Renew"],
          ["Quotation attachment", "RFQ-2605-018", "Open", "Supplier", "May 28", "Submit"],
          ["Stamped contract copy", "CTR-2026-052", "Signature", "Supplier", "May 26", "Upload"],
          ["Packing label", "PO-45001292", "Approved", "System", "May 28", "Print"]
        ], "document"))}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

// ===================== ADMIN PAGES =====================

async function adminDashboardPage() {
  try {
    const stats = await api('/admin/stats');
    return `
      <div class="admin-grid">
        <div class="admin-card"><strong>${stats.users}</strong><span>Users</span></div>
        <div class="admin-card"><strong>${stats.suppliers}</strong><span>Suppliers</span></div>
        <div class="admin-card"><strong>${stats.rfqs}</strong><span>RFQs</span></div>
        <div class="admin-card"><strong>${stats.orders}</strong><span>Orders</span></div>
      </div>
      <div class="grid-2">
        ${panel("System Status", `
          <div class="cards-list">
            <div class="mini-card"><div><strong>Database</strong><p>In-memory SQLite (resets on restart)</p></div><span class="badge green">Active</span></div>
            <div class="mini-card"><div><strong>API Server</strong><p>Express.js running</p></div><span class="badge green">Healthy</span></div>
            <div class="mini-card"><div><strong>Authentication</strong><p>JWT token-based</p></div><span class="badge green">Active</span></div>
          </div>
        `)}
        ${panel("Quick Actions", `
          <div class="drawer-actions">
            <button class="primary-btn" data-action="reset-data" type="button">Reset Demo Data</button>
            <button class="secondary-btn" data-action="export-logs" type="button">Export Audit Logs</button>
          </div>
          <div class="danger-zone">
            <h3>Danger Zone</h3>
            <p style="color:#666;font-size:13px;margin-bottom:12px">Reset will restore all data to initial demo state. This cannot be undone.</p>
            <button class="danger-btn" data-action="reset-data" type="button">Reset All Data</button>
          </div>
        `)}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function adminUsersPage() {
  try {
    const users = await api('/suppliers'); // Using suppliers as proxy for now
    return `
      ${panel("User Management", `
        <div class="empty">User management interface - view and manage system users</div>
      `)}
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function adminConfigPage() {
  try {
    const configs = await api('/admin/config');
    return `
      ${panel("System Configuration", `
        <table class="config-table">
          <thead><tr><th>Key</th><th>Value</th><th>Category</th><th>Action</th></tr></thead>
          <tbody>
            ${configs.map(c => `
              <tr>
                <td>${c.key}</td>
                <td><input value="${c.value}" data-config-id="${c.id}" class="config-input" /></td>
                <td>${c.category}</td>
                <td><button class="secondary-btn config-save" data-config-id="${c.id}" type="button">Save</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `)}
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function adminAuditPage() {
  try {
    const history = await api('/history');
    return `
      ${panel("Audit Logs", `
        <div class="timeline">
          ${history.slice(0, 20).map(h => timeline(h.user_id, `${h.action} - ${h.details}`, new Date(h.created_at).toLocaleString())).join('')}
        </div>
      `)}
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

const renderers = {
  command: commandPage,
  suppliers: suppliersPage,
  sourcing: sourcingPage,
  tender: tenderPage,
  contracts: contractsPage,
  collaboration: collaborationPage,
  performance: performancePage,
  admin: adminPage,
  portalHome: supplierHomePage,
  profile: profilePage,
  opportunities: opportunitiesPage,
  bidding: biddingPage,
  orders: ordersPage,
  settlement: settlementPage,
  messages: messagesPage,
  dashboard: adminDashboardPage,
  users: adminUsersPage,
  config: adminConfigPage,
  audit: adminAuditPage
};

function iconSvg(name) {
  const attrs = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  const icons = {
    dashboard: `<svg ${attrs}><rect x="4" y="4" width="6" height="6" rx="1.5"></rect><rect x="14" y="4" width="6" height="6" rx="1.5"></rect><rect x="4" y="14" width="6" height="6" rx="1.5"></rect><path d="M14 17h6"></path><path d="M17 14v6"></path></svg>`,
    users: `<svg ${attrs}><path d="M16 19c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4"></path><circle cx="10" cy="8" r="4"></circle><path d="M20 19c0-1.7-1-3.1-2.4-3.7"></path><path d="M17 5.2a3.4 3.4 0 0 1 0 6.6"></path></svg>`,
    search: `<svg ${attrs}><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m16 16 4 4"></path><path d="M7.5 10.5h6"></path></svg>`,
    gavel: `<svg ${attrs}><path d="m14 6 4 4"></path><path d="m5 15 4 4"></path><path d="m8 12 6-6 4 4-6 6z"></path><path d="m2 22 7-7"></path><path d="M14 22h8"></path></svg>`,
    file: `<svg ${attrs}><path d="M7 3h7l4 4v14H7z"></path><path d="M14 3v5h5"></path><path d="M10 13h6"></path><path d="M10 17h4"></path></svg>`,
    truck: `<svg ${attrs}><path d="M3 6h11v10H3z"></path><path d="M14 10h4l3 3v3h-7z"></path><circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle></svg>`,
    chart: `<svg ${attrs}><path d="M4 19V5"></path><path d="M4 19h16"></path><path d="M8 16v-5"></path><path d="M12 16V8"></path><path d="M16 16v-9"></path></svg>`,
    settings: `<svg ${attrs}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a8.2 8.2 0 0 0 .1-2l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L15 5.5h-4l-.4 2.6a8 8 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a8.2 8.2 0 0 0 .1 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.4 2.6h4l.4-2.6a8 8 0 0 0 1.7-1l2.4 1 2-3.4z"></path></svg>`,
    home: `<svg ${attrs}><path d="M4 11 12 4l8 7"></path><path d="M6 10v10h12V10"></path><path d="M10 20v-6h4v6"></path></svg>`,
    id: `<svg ${attrs}><rect x="4" y="5" width="16" height="14" rx="2"></rect><circle cx="10" cy="11" r="2"></circle><path d="M7.5 16c.8-1.4 4.2-1.4 5 0"></path><path d="M15 10h3"></path><path d="M15 14h3"></path></svg>`,
    mail: `<svg ${attrs}><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path></svg>`,
    timer: `<svg ${attrs}><circle cx="12" cy="13" r="7"></circle><path d="M12 13V9"></path><path d="M12 13h3"></path><path d="M9 3h6"></path></svg>`,
    package: `<svg ${attrs}><path d="m12 3 8 4-8 4-8-4z"></path><path d="M4 7v9l8 5 8-5V7"></path><path d="M12 11v10"></path></svg>`,
    receipt: `<svg ${attrs}><path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1z"></path><path d="M9 8h6"></path><path d="M9 12h6"></path><path d="M9 16h4"></path></svg>`,
    folder: `<svg ${attrs}><path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M3 7V6a2 2 0 0 1 2-2h4l2 3"></path></svg>`
  };
  return icons[name] || icons.dashboard;
}

function renderNav() {
  const navEl = document.getElementById("nav");
  const items = nav[workspace] || nav.buyer;
  navEl.innerHTML = items.map(([id, icon, label]) => `
    <button class="${id === state.page ? "active" : ""}" type="button" data-page="${id}">
      <span class="nav-icon" aria-hidden="true">${iconSvg(icon)}</span>
      <span>${label}</span>
    </button>
  `).join("");
}

async function render() {
  const wsLabel = workspace === "buyer" ? "Buyer Workspace" : workspace === "admin" ? "Admin Console" : "Supplier Portal";
  document.getElementById("workspaceLabel").textContent = wsLabel;
  document.getElementById("pageTitle").textContent = pageTitles[state.page] || "Dashboard";
  const pa = document.getElementById("primaryAction");
  if (pa) pa.textContent = primaryActions[state.page] || "Action";
  renderNav();

  const contentEl = document.getElementById("content");
  contentEl.innerHTML = '<div class="empty">Loading...</div>';

  const renderer = renderers[state.page];
  if (renderer) {
    try {
      const html = await renderer();
      contentEl.innerHTML = html;
      bindDynamicEvents();
    } catch (e) {
      contentEl.innerHTML = `<div class="empty">Error: ${e.message}</div>`;
    }
  } else {
    contentEl.innerHTML = '<div class="empty">Page not found</div>';
  }
}

function bindDynamicEvents() {
  document.querySelectorAll("#nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.page = btn.dataset.page;
      state.tab = "all";
      render();
    });
  });
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      openDrawer("Filtered view", btn.textContent, "The workbench filters records by this state while retaining the same approval and audit controls.");
    });
  });
  document.querySelectorAll("[data-record]").forEach((row) => {
    row.addEventListener("click", () => openRecord(row.dataset.type, row.dataset.record));
  });
  document.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => openDrawer("Action", btn.textContent.trim(), drawerContentFor(btn.dataset.open)));
  });
  document.querySelectorAll("[data-kpi]").forEach((card) => {
    card.addEventListener("click", () => {
      const label = card.dataset.kpi;
      openDrawer("Dashboard insight", label, insightContent(label));
    });
  });
  document.querySelectorAll("[data-step]").forEach((step) => {
    step.addEventListener("click", () => {
      const label = step.dataset.step;
      openDrawer("Process step", label, processStepContent(label));
    });
  });
  document.querySelectorAll(".mini-card, .compare-card, .system-card, .flow-line, .status-card, .context-strip > div").forEach((card) => {
    card.classList.add("interactive");
    card.addEventListener("click", () => {
      const title = card.querySelector("strong")?.textContent || card.textContent.trim().split("\n")[0] || "Detail";
      openDrawer("Workspace detail", title, cardDetailContent(title, card.textContent.trim()));
    });
  });

  // Action handlers
  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.action;
      try {
        if (action === 'create-rfq') {
          showToast("RFQ Created", "The RFQ has been created and sent to suppliers.");
        } else if (action === 'update-profile') {
          showToast("Profile Updated", "Your profile update has been submitted for review.");
        } else if (action === 'submit-quote') {
          showToast("Quote Submitted", "Your quotation response has been recorded.");
        } else if (action === 'submit-bid') {
          showToast("Bid Submitted", "Your auction bid has been accepted.");
        } else if (action === 'create-asn') {
          showToast("ASN Created", "Advanced Shipping Notice has been sent.");
        } else if (action === 'upload-invoice') {
          showToast("Invoice Uploaded", "Invoice has been submitted for OCR verification.");
        } else if (action === 'reset-data') {
          await api('/admin/reset', { method: 'POST' });
          showToast("Data Reset", "All demo data has been reset to initial state.");
          render();
        } else if (action === 'export-logs') {
          showToast("Export Started", "Audit logs export is being prepared.");
        }
      } catch (e) {
        showToast("Error", e.message);
      }
    });
  });

  // Config save handlers
  document.querySelectorAll(".config-save").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.configId);
      const input = document.querySelector(`.config-input[data-config-id="${id}"]`);
      try {
        await api(`/admin/config/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ value: input.value })
        });
        showToast("Saved", "Configuration updated successfully.");
      } catch (e) {
        showToast("Error", e.message);
      }
    });
  });
}

function openRecord(type, record) {
  const content = `
    <div class="detail-card">
      <h3>${record}</h3>
      <p>${recordNarrative(type)}</p>
    </div>
    ${workflow([
      ["Create", "Record is created with owner, due date and required documents."],
      ["Review", "Required buyer, supplier, quality or finance checks are completed."],
      ["Approve", "Approval history and comments are retained for audit."],
      ["Sync", "Approved business outcome is synchronized with D365 where applicable."],
      ["Monitor", "Exception, SLA and status are visible on dashboards."]
    ])}
    <div class="drawer-actions">
      <button class="primary-btn" type="button">Continue workflow</button>
      <button class="secondary-btn" type="button">View audit trail</button>
      <button class="ghost-btn" type="button">Export</button>
    </div>
  `;
  openDrawer(type.toUpperCase(), record, content);
}

function recordNarrative(type) {
  const map = {
    supplier: "Supplier profile, qualification documents, category mapping, approval status and D365 vendor synchronization are controlled from this record.",
    rfq: "RFQ scope, supplier invitation, commercial rounds, quote comparison, award approval and price-library update are retained in one sourcing record.",
    bid: "Auction ranking, time stamps, submitted prices and rule compliance are recorded with a full audit trail.",
    contract: "Contract template, clause changes, approval route, signature status, expiry alert and related price items are managed here.",
    price: "Approved contract prices are governed in the SRM price library and synchronized to Aden's downstream catalog where required.",
    order: "D365 PO details are visible to suppliers for confirmation, ASN, packing list, labels, receipt exception handling and reconciliation.",
    settlement: "Monthly settlement, receipt variance, supplier confirmation, invoice OCR and invoice verification are controlled before AP handover.",
    capa: "Performance issue, corrective action owner, due date, evidence and closure approval are tracked in supplier performance management.",
    opportunity: "Supplier can view event rules, download attachments, submit responses and ask clarification questions before deadline.",
    document: "Document version, owner, approval status and related business record are retained in the portal document center."
  };
  return map[type] || "The selected business record opens with workflow history, documents, comments, approval status and integration traceability.";
}

function drawerContentFor(type) {
  const common = {
    supplier: ["Supplier onboarding", "Capture company profile, qualification files, category mapping, bank details and approval route before supplier activation."],
    rfq: ["RFQ setup", "Define sourcing scope, invite suppliers, configure response rounds, attach documents and prepare commercial comparison rules."],
    contract: ["Contract drafting", "Select a controlled template, confirm payment terms, route legal and commercial approval, then activate linked price items."],
    profile: ["Profile update request", "Submit company, tax, banking and certification updates for Aden buyer review before they are used in transactions."],
    quote: ["Quotation response", "Provide price, lead time, MOQ, certificates and attachments. The submitted response is locked at the round deadline."],
    bid: ["Auction bid submission", "Validate minimum decrement, remaining time and bidder eligibility before the bid is accepted into the auction log."],
    asn: ["Advanced shipping notice", "Create delivery information, packing list, labels and logistics contact details for Aden site receiving."],
    invoice: ["Invoice upload and verification", "Upload invoice data for OCR recognition and verification. Exceptions are returned before AP handover."],
    command: ["New sourcing request", "Start from category, materials, supplier invite list and sourcing method before publishing the event."],
    tender: ["Tender event setup", "Prepare tender notice, pre-qualification rules, clarification window, bid opening method and award approval path."],
    collaboration: ["PO collaboration action", "Publish or follow up PO confirmation, delivery plan, receipt exception and monthly settlement status."],
    performance: ["Supplier review", "Create a scorecard review, assign evaluation owners and track corrective actions through closure."],
    admin: ["Integration configuration", "Configure endpoint ownership, retry policy, monitoring thresholds and audit log retention for each interface."],
    portalHome: ["Task workbench", "Open the supplier task queue and continue the highest priority quotation, PO, ASN or settlement activity."],
    opportunities: ["Opportunity response", "Review event documents, ask clarification questions and submit commercial response before the deadline."],
    orders: ["Delivery preparation", "Confirm PO lines, create ASN, upload packing details and print labels for site receipt."],
    settlement: ["Statement confirmation", "Review receipt details, confirm monthly statement and prepare invoice submission."],
    messages: ["Document upload", "Upload the requested file, link it to the business record and notify the buyer."]
  };
  const meta = common[type] || ["Workflow action", "Continue the selected workflow with owner, due date, comments, attachments and approval history."];
  return `
    <div class="detail-card"><h3>${meta[0]}</h3><p>${meta[1]}</p></div>
    <div class="form-grid">
      ${field("Owner", workspace === "buyer" ? "Aden Procurement" : (currentUser?.name || "Supplier user"))}
      ${field("Priority", "Normal", "select")}
      ${field("Due date", "2026-06-03")}
      ${field("Comment", "Business comments, attachments and workflow decisions would be captured here.", "textarea")}
    </div>
    <div class="drawer-actions">
      <button class="primary-btn" data-drawer-submit type="button">Submit</button>
      <button class="secondary-btn" data-drawer-save type="button">Save draft</button>
    </div>
  `;
}

function insightContent(label) {
  return `
    <div class="detail-card">
      <h3>${label}</h3>
      <p>Open the drill-down view to inspect trend, owner, related records and exceptions behind this dashboard metric.</p>
    </div>
    <div class="metric-row">
      <div class="metric"><span>Today</span><strong>${label.includes("%") ? "99.6%" : "18"}</strong></div>
      <div class="metric"><span>7-day trend</span><strong>+4.2%</strong></div>
      <div class="metric"><span>Open actions</span><strong>6</strong></div>
    </div>
    <div class="drawer-actions">
      <button class="primary-btn" data-drawer-submit type="button">Open report</button>
      <button class="secondary-btn" data-drawer-save type="button">Pin metric</button>
    </div>
  `;
}

function processStepContent(label) {
  return `
    <div class="detail-card">
      <h3>${label}</h3>
      <p>This step shows responsible roles, required documents, SLA target and the next available action for the selected process stage.</p>
    </div>
    <div class="cards-list">
      <div class="mini-card"><div><strong>Owner</strong><p>${workspace === "buyer" ? "Aden Procurement / Category Owner" : "Supplier account user"}</p></div><span class="badge blue">Role</span></div>
      <div class="mini-card"><div><strong>SLA target</strong><p>Standard tasks are expected to be completed within 2 working days.</p></div><span class="badge green">On track</span></div>
      <div class="mini-card"><div><strong>Required record</strong><p>Business comments, document attachments and approval decision are retained with this step.</p></div><span class="badge gray">Audit</span></div>
    </div>
  `;
}

function cardDetailContent(title, text) {
  return `
    <div class="detail-card">
      <h3>${title}</h3>
      <p>${text.replace(/\s+/g, " ").slice(0, 220)}</p>
    </div>
    <div class="drawer-actions">
      <button class="primary-btn" data-drawer-submit type="button">Open related records</button>
      <button class="secondary-btn" data-drawer-save type="button">Add note</button>
    </div>
  `;
}

function openDrawer(kicker, title, body) {
  document.getElementById("drawerKicker").textContent = kicker;
  document.getElementById("drawerTitle").textContent = title;
  document.getElementById("drawerBody").innerHTML = body;
  document.getElementById("drawerBackdrop").hidden = false;
  document.getElementById("drawer").classList.add("open");
  document.getElementById("drawer").setAttribute("aria-hidden", "false");
  bindDrawerActions();
}

function bindDrawerActions() {
  document.querySelectorAll("[data-drawer-submit]").forEach((btn) => {
    btn.addEventListener("click", () => showToast("Submitted", "The workflow action has been recorded for this prototype session."));
  });
  document.querySelectorAll("[data-drawer-save]").forEach((btn) => {
    btn.addEventListener("click", () => showToast("Saved", "Draft changes are saved locally in the prototype session."));
  });
}

function showToast(title, message) {
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
  stack.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("hide");
    window.setTimeout(() => toast.remove(), 220);
  }, 2400);
}

function closeDrawer() {
  document.getElementById("drawerBackdrop").hidden = true;
  document.getElementById("drawer").classList.remove("open");
  document.getElementById("drawer").setAttribute("aria-hidden", "true");
}

const paBtn = document.getElementById("primaryAction");
if (paBtn) {
  paBtn.addEventListener("click", () => {
    const title = primaryActions[state.page] || "Create";
    const actionType = state.page === "sourcing" ? "rfq" : state.page;
    openDrawer("Primary action", title, drawerContentFor(actionType));
  });
}

const notifBtn = document.getElementById("openNotifications");
if (notifBtn) {
  notifBtn.addEventListener("click", async () => {
    try {
      const notifications = await api('/notifications');
      const items = notifications.slice(0, 10).map(n => timeline(n.title, n.message, new Date(n.created_at).toLocaleString()));
      openDrawer("Notifications", "Open tasks and alerts", `
        <div class="timeline">
          ${items.join('') || '<div class="empty">No notifications</div>'}
        </div>
        <div class="drawer-actions">
          <button class="secondary-btn" id="markAllRead" type="button">Mark all read</button>
        </div>
      `);
      document.getElementById('markAllRead')?.addEventListener('click', async () => {
        await api('/notifications/mark-all-read', { method: 'POST' });
        showToast("Notifications", "All notifications marked as read.");
      });
    } catch (e) {
      openDrawer("Notifications", "Open tasks and alerts", `
        <div class="timeline">
          ${timeline("RFQ deadline", "RFQ-2605-018 closes in 3 days.", "Today 10:16")}
          ${timeline("Contract alert", "CTR-2025-117 expires in 33 days.", "Today 09:04")}
          ${timeline("Integration", "7 queued messages are waiting for retry.", "Today 08:48")}
          ${timeline("Supplier portal", "STM-2605-144 has been confirmed by supplier.", "Yesterday 17:21")}
        </div>
      `);
    }
  });
}

const searchInput = document.getElementById("globalSearch");
if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    const term = event.target.value.trim().toLowerCase();
    document.querySelectorAll("tbody tr").forEach((row) => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? "" : "none";
    });
    window.clearTimeout(searchToastTimer);
    if (term.length > 2) {
      searchToastTimer = window.setTimeout(() => showToast("Search applied", `Filtered visible records by "${event.target.value.trim()}"`), 450);
    }
  });
}

document.getElementById("closeDrawer")?.addEventListener("click", closeDrawer);
document.getElementById("drawerBackdrop")?.addEventListener("click", closeDrawer);

// Logout button
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem('aden_token');
    localStorage.removeItem('aden_user');
    window.location.href = './login.html';
  });
}

render();
