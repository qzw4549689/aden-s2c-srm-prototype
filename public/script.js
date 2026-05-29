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
    ["spendAnalytics", "barChart", "Spend Analytics"],
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
  spendAnalytics: "Spend Analytics",
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
  spendAnalytics: "Export Report",
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
  if (value.includes("exception") || value.includes("expiry") || value.includes("hold") || value.includes("mismatch") || value.includes("overdue") || value.includes("rejected") || value.includes("disputed") || value.includes("returned")) return "red";
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
              if (index === 3 || (typeof cell === 'string' && !cell.includes('<') && String(cell).match(/Qualified|Trial|Potential|Open|Draft|review|approval|Signature|Active|Confirmed|planned|Passed|Exception|Expiry|Approved|Rejected|Disputed|Shipped|Preparing|Returned|Buyer Review|Award Pending|Award Approved|Partially Confirmed|Change Requested|Invoice Submitted|Supplier Confirmed/i))) {
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
  if (type === "textarea") return `<div class="field"><label>${label}</label><textarea name="${nm}" class="form-input">${value || ""}</textarea></div>`;
  if (type === "select") return `<div class="field"><label>${label}</label><select name="${nm}" class="form-input"><option>${value}</option></select></div>`;
  return `<div class="field"><label>${label}</label><input name="${nm}" value="${value || ""}" type="${type}" class="form-input" /></div>`;
}

// Collect form data from a container element
function collectFormData(container) {
  const data = {};
  if (!container) return data;
  container.querySelectorAll('.form-input, [name]').forEach(el => {
    if (el.name) data[el.name] = el.value;
  });
  return data;
}

function bar(label, pct) {
  return `<div class="bar-row interactive" data-kpi="${label} performance"><span>${label}</span><div class="bar-track"><i style="width:${pct}%"></i></div><strong>${pct}</strong></div>`;
}

function timeline(who, text, time) {
  return `<div class="timeline-item"><i></i><div><strong>${who}</strong><span>${text}<br>${time}</span></div></div>`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount, currency = 'CNY') {
  if (amount === null || amount === undefined) return '-';
  return `${currency} ${Number(amount).toLocaleString()}`;
}

// ===================== BUYER PAGES =====================

async function commandPage() {
  try {
    const data = await api('/dashboard');
    const k = data.kpi || {};
    const isBuyer = data.role === 'buyer';
    return `
      <div class="grid-4">
        ${isBuyer ? `
          ${kpi("Active RFx events", k.active_rfqs || 0, "Events requiring attention", 72)}
          ${kpi("Pending Awards", k.pending_awards || 0, "Award approval pending", 88)}
          ${kpi("Pending POs", k.pending_pos || 0, "Awaiting supplier confirmation", 48)}
          ${kpi("Pending Tasks", k.pending_tasks || 0, "Tasks assigned to you", 64)}
        ` : `
          ${kpi("Open Invitations", k.open_rfqs || 0, "RFQ opportunities", 64)}
          ${kpi("POs to Confirm", k.pending_pos || 0, "Confirm quantity and delivery", 52)}
          ${kpi("Statements", k.pending_settlements || 0, "Monthly billing settlement", 40)}
          ${kpi("Pending Tasks", k.pending_tasks || 0, "Tasks requiring your action", 72)}
        `}
      </div>
      ${isBuyer ? `<div class="grid-3">
        ${kpi("Total Spend", k.total_spend || "¥856,000", "Cumulative spend YTD", 85)}
        ${kpi("Pending Contracts", k.pending_contracts || 2, "Awaiting approval/signature", 60)}
        ${kpi("Savings Opportunity", k.savings_opportunity || "¥42,800", "Estimated from competitive bidding", 45)}
      </div>` : ''}
      ${panel("End-to-end S2C operating flow", workflow([
        ["Spend & demand", "Category demand and purchase needs are consolidated before sourcing."],
        ["Supplier discovery", "Registration, qualification, credit and duplicate checks are governed in SRM."],
        ["RFx / tender", "Public RFQ, invited RFQ, tender, auction and multi-round negotiation are supported."],
        ["Award & contract", "Award approval, contract drafting, signature tracking and price library are controlled."],
        ["Collaboration", "PO confirmation, delivery, reconciliation and invoice preparation are handled in portal."]
      ]))}
      <div class="split">
        ${panel("Current sourcing pipeline", table(["Record", "Scope", "Status", "Suppliers", "Due date", "Round"],
          (data.recent_rfqs || []).map(r => [r.rfq_no, r.title, r.status, '-', formatDate(r.due_at), '-']), "rfq"))}
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
        ${panel("Supplier master list", table(["Supplier ID", "Supplier", "Category", "Status", "Score", "Location", "Contact"],
          suppliers.map(s => [s.id, s.org_name || s.short_name, s.category, s.qualification_status, s.score, s.service_area, s.contact_name]), "supplier"),
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
    const tabItems = [["all", "All RFQs"], ["Draft", "Draft"], ["Published", "Open"], ["Comparison", "Comparison"], ["Award", "Award"]];
    let filtered = rfqs;
    if (state.tab !== 'all') {
      if (state.tab === 'Award') filtered = rfqs.filter(r => r.status === 'Award Pending' || r.status === 'Award Approved');
      else if (state.tab === 'Comparison') filtered = rfqs.filter(r => r.status === 'Comparison');
      else filtered = rfqs.filter(r => r.status === state.tab);
    }
    return `
      <div class="split">
        ${panel("RFQ workbench", `
          ${tabs(tabItems, state.tab)}
          <div class="spacer"></div>
          ${table(["RFQ", "Scope", "Status", "Category", "Due date", "Award"],
            filtered.map(r => [r.rfq_no, r.title, r.status, r.category, formatDate(r.due_at), r.award_supplier_id ? 'Yes' : '-']), "rfq")}
        `, `<button class="secondary-btn" data-open="rfq" type="button">New RFQ</button>`)}
        ${panel("Create RFQ", `
          <div class="form-grid" data-form="rfq">
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
        <div class="drawer-actions page-actions">
          <button class="secondary-btn" data-action="view-comparison" type="button">View Full Comparison</button>
        </div>
      `)}
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function tenderPage() {
  try {
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
    const statusFilter = state.contractFilter || 'all';
    const filtered = statusFilter === 'all' ? contracts : contracts.filter(c => c.status === statusFilter);

    return `
      <div class="filter-tabs">
        ${['all', 'draft', 'under_review', 'approved', 'signed', 'returned'].map(s =>
          `<button class="${s === statusFilter ? 'active' : ''}" data-contract-filter="${s}" type="button">${s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</button>`
        ).join('')}
      </div>
      <div class="split">
        ${panel("Contract repository", table(["Contract", "Supplier", "Amount", "Start", "End", "Status"],
          filtered.map(c => [c.contract_no || c.id, c.supplier_name || '-', formatCurrency(c.total_amount, c.currency), formatDate(c.start_date), formatDate(c.end_date), c.status]), "contract"),
          `<button class="secondary-btn" data-action="new-contract" type="button">New contract</button>`)}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function openContractDrawer(contractId) {
  try {
    const contract = await api(`/contracts/${contractId}`);
    const actions = [];
    if (contract.status === 'draft' || contract.status === 'returned') {
      actions.push(`<button class="primary-btn" data-action="contract-submit" data-id="${contract.id}" type="button">Submit for Approval</button>`);
    }
    if (contract.status === 'under_review') {
      actions.push(`<button class="primary-btn" data-action="contract-approve" data-id="${contract.id}" type="button">Approve</button>`);
      actions.push(`<button class="secondary-btn" data-action="contract-return" data-id="${contract.id}" type="button">Return</button>`);
    }
    if (contract.status === 'approved') {
      actions.push(`<button class="primary-btn" data-action="contract-sign" data-id="${contract.id}" type="button">Sign Contract</button>`);
    }

    drawerKicker.textContent = 'Contract Detail';
    drawerTitle.textContent = contract.contract_no;
    drawerBody.innerHTML = `
      <div class="detail-section">
        <p><span class="badge ${badgeClass(contract.status)}">${contract.status.replace('_', ' ').toUpperCase()}</span></p>
        <p><strong>Supplier:</strong> ${contract.supplier_name || '-'}</p>
        <p><strong>Amount:</strong> ${formatCurrency(contract.total_amount, contract.currency)}</p>
        <p><strong>Period:</strong> ${formatDate(contract.start_date)} ~ ${formatDate(contract.end_date)}</p>
        ${contract.rfq_no ? `<p><strong>Associated RFQ:</strong> ${contract.rfq_no}</p>` : ''}
        ${contract.rejection_reason ? `<p class="text-red"><strong>Return Reason:</strong> ${contract.rejection_reason}</p>` : ''}
        ${contract.signed_at ? `<p><strong>Signed at:</strong> ${formatDate(contract.signed_at)}</p>` : ''}
      </div>
      <div class="detail-section">
        <h4>Terms & Conditions</h4>
        <p>${contract.terms || 'No terms specified.'}</p>
      </div>
      <div class="drawer-actions">
        ${actions.join('')}
      </div>
    `;
    drawer.setAttribute('aria-hidden', 'false');
    drawerBackdrop.hidden = false;
  } catch (e) {
    showToast(`Error: ${e.message}`, 'error');
  }
}

async function spendAnalyticsPage() {
  try {
    const overview = await api('/spend-analytics/overview');
    const byCategory = await api('/spend-analytics/by-category');
    const bySupplier = await api('/spend-analytics/by-supplier');
    const trends = await api('/spend-analytics/trends');

    return `
      <div class="grid-4">
        ${kpi(formatCurrency(overview.total_spend, overview.currency), "Total Spend", "Cumulative spend across all categories", overview.yoy_change)}
        ${kpi(overview.total_orders, "Total Orders", "Purchase orders processed", 8)}
        ${kpi(overview.active_suppliers, "Active Suppliers", "Suppliers with orders in period", 0)}
        ${kpi("¥" + (overview.total_spend * 0.05).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","), "Savings Opportunity", "Estimated savings based on competitive bidding", 15)}
      </div>
      <div class="grid-2">
        ${panel("Spend by Category", `
          <div class="chart-container" style="height:280px;">
            <canvas id="categoryChart"></canvas>
          </div>
          <div class="category-legend">
            ${byCategory.map(c => `
              <div class="legend-item">
                <span class="legend-dot" style="background:${categoryColors[c.category] || '#999'}"></span>
                <span>${c.category}</span>
                <strong>${c.percentage}%</strong>
              </div>
            `).join('')}
          </div>
        `)}
        ${panel("Top Suppliers by Spend", `
          <div class="chart-container" style="height:280px;">
            <canvas id="supplierChart"></canvas>
          </div>
        `)}
      </div>
      <div class="grid-1">
        ${panel("12-Month Spend Trend", `
          <div class="chart-container" style="height:260px;">
            <canvas id="trendChart"></canvas>
          </div>
        `)}
      </div>
      <div class="grid-1">
        ${panel("Savings Opportunities", table(["Category", "Current Spend", "Potential Savings", "Action"], [
          ["Food ingredients", "¥385,200", "¥19,260 (5%)", "Consolidate suppliers"],
          ["Frozen food", "¥256,800", "¥12,840 (5%)", "Negotiate volume discount"],
          ["Packaging", "¥128,400", "¥6,420 (5%)", "Explore local alternatives"],
          ["Consumables", "¥85,600", "¥4,280 (5%)", "Standardize specifications"],
        ]))}
      </div>
      <script>
        (function() {
          if (typeof Chart === 'undefined') return;
          const catColors = ${JSON.stringify(byCategory.reduce((acc, c) => { acc[c.category] = categoryColors[c.category]; return acc; }, {}))};
          const catData = ${JSON.stringify(byCategory)};
          const supData = ${JSON.stringify(bySupplier)};
          const trendData = ${JSON.stringify(trends)};

          setTimeout(() => {
            // Category pie chart
            const catCtx = document.getElementById('categoryChart');
            if (catCtx) {
              new Chart(catCtx, {
                type: 'doughnut',
                data: {
                  labels: catData.map(c => c.category),
                  datasets: [{ data: catData.map(c => c.amount), backgroundColor: catData.map(c => catColors[c.category] || '#999'), borderWidth: 0 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
              });
            }
            // Supplier bar chart
            const supCtx = document.getElementById('supplierChart');
            if (supCtx) {
              new Chart(supCtx, {
                type: 'bar',
                data: {
                  labels: supData.map(s => s.supplier_name.length > 12 ? s.supplier_name.substring(0, 12) + '...' : s.supplier_name),
                  datasets: [{ label: 'Spend (CNY)', data: supData.map(s => s.amount), backgroundColor: '#F05A28', borderRadius: 4 }]
                },
                options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }
              });
            }
            // Trend line chart
            const trendCtx = document.getElementById('trendChart');
            if (trendCtx) {
              new Chart(trendCtx, {
                type: 'line',
                data: {
                  labels: trendData.map(t => t.month),
                  datasets: [{ label: 'Spend (CNY)', data: trendData.map(t => t.amount), borderColor: '#F05A28', backgroundColor: 'rgba(240,90,40,0.1)', fill: true, tension: 0.4, pointRadius: 3 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f0f0f0' } } } }
              });
            }
          }, 100);
        })();
      </script>
    `;
  } catch (e) {
    return `<div class="empty">Error loading analytics: ${e.message}</div>`;
  }
}

const categoryColors = {
  "Food ingredients": "#F05A28",
  "Frozen food": "#4A90D9",
  "Packaging": "#50C878",
  "Consumables": "#FFB347",
  "LSP": "#9B59B6",
  "Equipment": "#34495E"
};

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
      ${panel("Settlement and invoice readiness", (() => {
        const collsHeaders = ["Record", "Supplier", "Period", "Status", "Amount", "Next step"];
        const collsRows = settlements.map(s => {
          const nextStep = s.status === 'Published' ? 'Confirm' : s.status === 'Disputed' ? `<button class="text-btn" data-dispute-stm="${s.id}">Review dispute</button>` : 'Approve';
          return `<tr data-record="${s.settlement_no}" data-type="settlement">
            <td><div class="record-title">${s.settlement_no}</div></td>
            <td>${s.supplier_name || '-'}</td>
            <td>${s.period}</td>
            <td><span class="badge ${badgeClass(s.status)}">${s.status}</span></td>
            <td>${formatCurrency(s.total_amount, 'CNY')}</td>
            <td>${nextStep}</td>
          </tr>`;
        }).join('');
        return `<table class="table" data-table="settlement"><thead><tr>${collsHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${collsRows}</tbody></table>`;
      })())}
      <div class="split">
        ${panel("PO and delivery collaboration", table(["PO", "Supplier", "Status", "Delivery date", "Amount", "Next step"],
          orders.map(o => [o.po_no, o.supplier_name || '-', o.status, formatDate(o.delivery_date), formatCurrency(o.total_amount, o.currency), o.status === 'Pending Supplier' ? 'Confirm' : o.status === 'Change Requested' ? 'Review change' : 'Track']), "order"))}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function performancePage() {
  try {
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
    const configs = await api('/admin/configs');
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
                <td><input value="${JSON.parse(c.value_json || '{}').value || ''}" data-config-key="${c.key}" class="config-input" /></td>
                <td>${c.category}</td>
                <td><button class="secondary-btn config-save" data-config-key="${c.key}" type="button">Save</button></td>
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
    const data = await api('/dashboard');
    const k = data.kpi || {};
    return `
      <div class="grid-4">
        ${kpi("Open invitations", k.open_rfqs || 0, "RFQ, tender and auction opportunities", 64)}
        ${kpi("POs to confirm", k.pending_pos || 0, "Confirm quantity and delivery window", 52)}
        ${kpi("Statements to approve", k.pending_settlements || 0, "Monthly billing settlement", 40)}
        ${kpi("Pending tasks", k.pending_tasks || 0, "Tasks requiring your action", 72)}
      </div>
      <div class="split">
        ${panel("Priority task list", `
          <div class="cards-list">
            ${(data.recent_pos || []).slice(0, 5).map(o => `
              <div class="mini-card"><div><strong>${o.po_no}</strong><p>Status: ${o.status} | Due: ${formatDate(o.delivery_date)}</p></div><span class="badge ${badgeClass(o.status)}">${o.status}</span></div>
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
  try {
    const profile = await api('/suppliers');
    const myProfile = profile.find(p => p.org_id === currentUser.orgId) || profile[0];
    cachedData.myProfileId = myProfile.id;
    return `
      <div class="split" data-profile-id="${myProfile.id}" data-profile-status="${myProfile.qualification_status}">
        ${panel("Company profile", `
          <div class="form-grid" data-form="profile">
            ${field("Legal entity", myProfile.org_name || "SuXin Food Co., Ltd.")}
            ${field("Supplier category", myProfile.category || "Prepared food", "select")}
            ${field("Tax registration number", myProfile.tax_certificate_no || "9132************")}
            ${field("Primary contact", myProfile.contact_name || "Linda Chen")}
            ${field("Bank account", myProfile.bank_account || "**** **** **** 8128")}
            ${field("Delivery coverage", myProfile.service_area || "Shanghai, Jiangsu, Zhejiang", "textarea")}
          </div>
          <div class="drawer-actions page-actions">
            <button class="primary-btn" data-action="update-profile" data-profile-id="${myProfile.id}" type="button">Submit update</button>
            <button class="secondary-btn" type="button">Save draft</button>
          </div>
        `)}
        ${panel("Qualification status", `
          <div class="cards-list">
            <div class="mini-card"><div><strong>Business license</strong><p>${myProfile.business_license_no ? 'Valid: ' + myProfile.business_license_no : 'Not submitted'}</p></div><span class="badge ${myProfile.business_license_no ? 'green' : 'red'}">${myProfile.business_license_no ? 'Approved' : 'Missing'}</span></div>
            <div class="mini-card"><div><strong>Food safety certificate</strong><p>${myProfile.food_safety_cert_no ? 'Cert: ' + myProfile.food_safety_cert_no : 'Not submitted'}</p></div><span class="badge ${myProfile.food_safety_cert_no ? 'green' : 'orange'}">${myProfile.food_safety_cert_no ? 'Approved' : 'Expires soon'}</span></div>
            <div class="mini-card"><div><strong>Bank profile</strong><p>Last buyer approval: ${formatDate(myProfile.approved_at)}</p></div><span class="badge ${myProfile.bank_account ? 'green' : 'red'}">${myProfile.bank_account ? 'Approved' : 'Missing'}</span></div>
            <div class="mini-card"><div><strong>Qualification status</strong><p>Score: ${myProfile.score || 0} / 100</p></div><span class="badge ${badgeClass(myProfile.qualification_status)}">${myProfile.qualification_status}</span></div>
          </div>
        `)}
      </div>
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function opportunitiesPage() {
  try {
    const rfqs = await api('/rfqs');
    const myRfqs = rfqs.filter(o => o.my_invitation_status !== 'pending');
    const quoteRfq = myRfqs[0];
    if (quoteRfq) cachedData.quoteRfqId = quoteRfq.id;
    return `
      <div class="split">
        ${panel("Available opportunities", table(["Event", "Scope", "Status", "Category", "Due date", "Action"],
          rfqs.map(o => [o.rfq_no, o.title, o.status, o.category, formatDate(o.due_at), o.my_invitation_status === 'pending' ? 'Accept' : 'Quote']), "opportunity"))}
        ${panel("Quotation response", `
          <div class="form-grid" data-form="quote">
            ${field("Unit price", "18.40")}
            ${field("Currency", "CNY", "select")}
            ${field("Lead time", "3 working days")}
            ${field("Minimum order quantity", "100 kg")}
            ${field("Commercial notes", "Price includes delivery to Aden designated site.", "textarea")}
            ${field("Attachments", "Product spec, certificate, quotation file")}
          </div>
          <div class="drawer-actions page-actions">
            <button class="primary-btn" data-action="submit-quote" data-rfq-id="${quoteRfq ? quoteRfq.id : ''}" type="button">Submit response</button>
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
    const asns = await api('/orders/asns/list');
    const confirmOrder = orders.find(o => o.status === 'Confirmed' || o.status === 'Partially Confirmed');
    if (confirmOrder) cachedData.asnOrderId = confirmOrder.id;
    return `
      ${panel("PO confirmation and delivery collaboration", workflow([
        ["PO received", "Review D365 formal PO exposed in the supplier portal."],
        ["Confirm", "Accept or propose delivery date and quantity adjustment."],
        ["ASN", "Create shipment notice, packing list, label and logistics information."],
        ["Receipt", "View site receipt and exception feedback from Aden."],
        ["Reconcile", "Accepted receipts are included in monthly settlement statement."]
      ]))}
      <div class="split">
        ${panel("PO list", table(["PO", "Buyer", "Status", "Delivery date", "Amount", "Next step"],
          orders.map(o => [o.po_no, "Aden Procurement", o.status, formatDate(o.delivery_date), formatCurrency(o.total_amount, o.currency), o.status === 'Pending Supplier' ? 'Confirm' : o.status === 'Change Requested' ? 'Review change' : 'Track']), "order"))}
        ${panel("Create ASN", `
          <div class="form-grid" data-form="asn">
            ${field("PO number", confirmOrder?.po_no || orders[0]?.po_no || "PO-45001292")}
            ${field("Shipment date", "2026-06-05")}
            ${field("Carrier", "SF Express cold chain")}
            ${field("Vehicle / tracking", "SH-A8128")}
            ${field("Packing list", "2 pallets, 80 cartons", "textarea")}
            ${field("Label template", "Aden site receiving label", "select")}
          </div>
          <div class="drawer-actions page-actions">
            <button class="primary-btn" data-action="create-asn" data-order-id="${confirmOrder ? confirmOrder.id : ''}" type="button">Send ASN</button>
            <button class="secondary-btn" type="button">Print labels</button>
          </div>
        `)}
      </div>
      ${panel("ASN History", table(["ASN", "PO", "Status", "Ship Date", "Carrier", "Tracking"],
        asns.map(a => [a.asn_no, a.po_no || '-', a.status, formatDate(a.ship_date), a.carrier || '-', a.tracking_no || '-']), "asn"))}
    `;
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function settlementPage() {
  try {
    const settlements = await api('/settlements');
    const invStm = settlements.find(s => s.status === 'Supplier Confirmed');
    if (invStm) cachedData.invoiceStmId = invStm.id;
    const currentTab = state.settlementTab || 'list';

    // Dispute history for supplier
    let disputeHistoryHtml = '';
    if (workspace === 'supplier') {
      try {
        const disputes = await api('/settlement-disputes/supplier/history');
        disputeHistoryHtml = `
          <div class="tabs">
            <button class="tab-btn ${currentTab === 'list' ? 'active' : ''}" data-tab="list" type="button">Settlement List</button>
            <button class="tab-btn ${currentTab === 'invoice' ? 'active' : ''}" data-tab="invoice" type="button">Invoice</button>
            <button class="tab-btn ${currentTab === 'disputes' ? 'active' : ''}" data-tab="disputes" type="button">Dispute History</button>
          </div>
          ${currentTab === 'disputes' ? panel("Dispute History", table(["Settlement", "Dispute Amount", "Status", "Resolved"],
            disputes.map(d => [d.settlement_no, formatCurrency(d.dispute_amount, 'CNY'), d.status, formatDate(d.resolved_at)]), "dispute")) : ''}
        `;
      } catch (e) { /* no dispute history */ }
    }

    // Build settlement table manually to handle dispute button HTML
    const stmHeaders = ["Record", "Period", "Status", "Amount", "Dispute", "Next step"];
    const stmRows = settlements.map(s => {
      const nextStep = s.status === 'Published' ? 'Confirm' : s.status === 'Disputed' ? `<button class="text-btn" data-dispute-stm="${s.id}">Review dispute</button>` : 'Track';
      return `<tr data-record="${s.settlement_no}" data-type="settlement">
        <td><div class="record-title">${s.settlement_no}</div><div class="record-sub">Click to open details</div></td>
        <td>${s.period}</td>
        <td><span class="badge ${badgeClass(s.status)}">${s.status}</span></td>
        <td>${formatCurrency(s.total_amount, 'CNY')}</td>
        <td>${s.dispute_amount > 0 ? formatCurrency(s.dispute_amount, 'CNY') : '-'}</td>
        <td>${nextStep}</td>
      </tr>`;
    }).join('');
    const stmTable = `<table class="table" data-table="settlement"><thead><tr>${stmHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${stmRows}</tbody></table>`;

    const listHtml = `
      <div class="split">
        ${panel("Monthly settlement and invoice control", stmTable + `<div style="margin-top:8px"><button class="secondary-btn" type="button">Download all</button></div>`)}
        ${panel("Invoice submission", `
          <div class="form-grid" data-form="invoice">
            ${field("Settlement statement", invStm?.settlement_no || settlements[0]?.settlement_no || "STM-2605-144")}
            ${field("Invoice type", "VAT special invoice", "select")}
            ${field("Invoice amount", "184260")}
            ${field("Tax amount", "11055.60")}
            ${field("OCR and verification", "Passed after upload")}
            ${field("Notes", "Original invoice submission after Aden statement confirmation.", "textarea")}
          </div>
          <div class="drawer-actions page-actions">
            <button class="primary-btn" data-action="upload-invoice" data-stm-id="${invStm ? invStm.id : ''}" type="button">Upload invoice</button>
            <button class="secondary-btn" type="button">Download statement</button>
          </div>
        `)}
      </div>
    `;

    return disputeHistoryHtml + (currentTab !== 'disputes' || workspace !== 'supplier' ? listHtml : '');
  } catch (e) {
    return `<div class="empty">Error: ${e.message}</div>`;
  }
}

async function openSettlementDisputeDrawer(settlementId) {
  try {
    const settlement = await api(`/settlements/${settlementId}`);
    const logs = await api(`/settlement-disputes/${settlementId}/dispute-logs`);

    const isBuyer = workspace === 'buyer' || workspace === 'admin';

    drawerKicker.textContent = 'Settlement Dispute';
    drawerTitle.textContent = settlement.settlement_no;
    drawerBody.innerHTML = `
      <div class="detail-section">
        <p><span class="badge ${badgeClass(settlement.status)}">${settlement.status.toUpperCase()}</span></p>
        <p><strong>Original Amount:</strong> ${formatCurrency(settlement.total_amount + (settlement.dispute_amount || 0), 'CNY')}</p>
        <p><strong>Dispute Amount:</strong> ${formatCurrency(settlement.dispute_amount || 0, 'CNY')}</p>
        ${settlement.dispute_reason ? `<p><strong>Dispute Reason:</strong> ${settlement.dispute_reason}</p>` : ''}
      </div>
      <div class="detail-section">
        <h4>Negotiation Log</h4>
        <div class="message-log">
          ${logs.length === 0 ? '<p class="text-muted">No messages yet.</p>' : logs.map(l => `
            <div class="message-item ${l.sender_role}">
              <div class="message-header">
                <strong>${l.sender_name || l.sender_role}</strong>
                <span class="text-muted">${formatDate(l.created_at)}</span>
              </div>
              <p>${l.message}</p>
            </div>
          `).join('')}
        </div>
      </div>
      ${settlement.status === 'Disputed' ? `
      <div class="detail-section">
        <h4>Add Message</h4>
        <textarea id="disputeMessageInput" class="input" rows="3" placeholder="Enter your message..."></textarea>
        <button class="primary-btn" data-action="send-dispute-message" data-settlement-id="${settlementId}" type="button">Send Message</button>
      </div>
      ${isBuyer ? `
      <div class="drawer-actions">
        <button class="primary-btn" data-action="accept-dispute" data-settlement-id="${settlementId}" type="button">Accept Dispute</button>
        <button class="secondary-btn" data-action="adjust-dispute" data-settlement-id="${settlementId}" type="button">Adjust Amount</button>
      </div>` : ''}
      ` : ''}
    `;
    drawer.setAttribute('aria-hidden', 'false');
    drawerBackdrop.hidden = false;
  } catch (e) {
    showToast(`Error: ${e.message}`, 'error');
  }
}

async function messagesPage() {
  try {
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
        <div class="admin-card"><strong>${stats.purchase_orders}</strong><span>Orders</span></div>
        <div class="admin-card"><strong>${stats.asns}</strong><span>ASNs</span></div>
        <div class="admin-card"><strong>${stats.settlements}</strong><span>Settlements</span></div>
        <div class="admin-card"><strong>${stats.invoices}</strong><span>Invoices</span></div>
        <div class="admin-card"><strong>${stats.tasks}</strong><span>Tasks</span></div>
      </div>
      <div class="grid-2">
        ${panel("System Status", `
          <div class="cards-list">
            <div class="mini-card"><div><strong>Database</strong><p>In-memory (resets on restart)</p></div><span class="badge green">Active</span></div>
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
    const users = await api('/admin/users');
    return `
      ${panel("User Management", `
        <table class="table">
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Org</th><th>Status</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>${u.id}</td>
                <td><div class="record-title">${u.display_name}</div></td>
                <td>${u.email}</td>
                <td><span class="badge ${badgeClass(u.role)}">${u.role}</span></td>
                <td>${u.org_id}</td>
                <td><span class="badge ${badgeClass(u.status)}">${u.status}</span></td>
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

async function adminConfigPage() {
  try {
    const configs = await api('/admin/configs');
    return `
      ${panel("System Configuration", `
        <table class="config-table">
          <thead><tr><th>Key</th><th>Value</th><th>Category</th><th>Action</th></tr></thead>
          <tbody>
            ${configs.map(c => `
              <tr>
                <td>${c.key}</td>
                <td><input value="${JSON.parse(c.value_json || '{}').value || ''}" data-config-key="${c.key}" class="config-input" /></td>
                <td>${c.category}</td>
                <td><button class="secondary-btn config-save" data-config-key="${c.key}" type="button">Save</button></td>
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
        <table class="table">
          <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Object</th><th>Object ID</th><th>Comments</th></tr></thead>
          <tbody>
            ${history.map(h => `
              <tr>
                <td>${formatDate(h.created_at)}</td>
                <td>${h.actor_name || h.actor_id}</td>
                <td><span class="badge ${badgeClass(h.action)}">${h.action}</span></td>
                <td>${h.object_type}</td>
                <td>${h.object_id}</td>
                <td>${h.comments || '-'}</td>
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

const renderers = {
  command: commandPage,
  spendAnalytics: spendAnalyticsPage,
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
    folder: `<svg ${attrs}><path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M3 7V6a2 2 0 0 1 2-2h4l2 3"></path></svg>`,
    barChart: `<svg ${attrs}><path d="M3 3v18h18"></path><path d="M7 16v-4"></path><path d="M11 16V8"></path><path d="M15 16v-6"></path><path d="M19 16v-2"></path></svg>`
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
      render();
    });
  });
  document.querySelectorAll("[data-record]").forEach((row) => {
    row.addEventListener("click", () => {
      if (row.dataset.type === 'contract') {
        openContractDrawer(parseInt(row.dataset.record));
      } else {
        openRecord(row.dataset.type, row.dataset.record);
      }
    });
  });
  // Contract filter tabs
  document.querySelectorAll("[data-contract-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.contractFilter = btn.dataset.contractFilter;
      render();
    });
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
          const formContainer = btn.closest('.panel')?.querySelector('[data-form="rfq"]');
          const formData = collectFormData(formContainer);
          await api('/rfqs', {
            method: 'POST',
            body: JSON.stringify({
              rfq_no: "RFQ-" + new Date().toISOString().slice(2,4) + new Date().toISOString().slice(5,7) + "-" + String(Math.floor(Math.random() * 900) + 100),
              title: formData.material___service_scope || "Ambient food ingredients",
              category: formData.category || "Food ingredients",
              currency: "CNY",
              due_at: (formData.response_deadline || "2026-06-10") + "T17:00:00Z",
              description: formData.supplier_invite_list || "New sourcing request from buyer",
              items: [{ line_no: 1, material_description: formData.material___service_scope || "Ambient food ingredients", quantity: 1000, unit: "kg" }]
            })
          });
          showToast("RFQ Created", "The RFQ has been created and sent to suppliers.");
          render();
        } else if (action === 'update-profile') {
          // Get the correct profile for current user's org
          const suppliers = await api('/suppliers');
          const myProfile = suppliers.find(p => p.org_id === currentUser.orgId);
          if (!myProfile) throw new Error('Profile not found for current user');
          const profileId = myProfile.id;
          // Read form data first
          const formContainer = btn.closest('.panel')?.querySelector('[data-form="profile"]');
          const formData = collectFormData(formContainer);
          // Map frontend field names to backend field names
          const updates = {};
          if (formData.legal_entity) updates.org_name = formData.legal_entity;
          if (formData.primary_contact) updates.contact_name = formData.primary_contact;
          if (formData.supplier_category) updates.category = formData.supplier_category;
          if (formData.tax_registration_number) updates.tax_certificate_no = formData.tax_registration_number;
          if (formData.bank_account) updates.bank_account = formData.bank_account;
          if (formData.delivery_coverage) updates.service_area = formData.delivery_coverage;
          // Save form data first
          if (Object.keys(updates).length > 0) {
            await api(`/suppliers/${profileId}`, { method: 'PUT', body: JSON.stringify(updates) });
          }
          // Then submit for review
          const result = await api(`/suppliers/${profileId}/submit`, { method: 'POST' });
          showToast("Profile Updated", `Status changed to: ${result.qualification_status}`);
          render();
        } else if (action === 'submit-quote') {
          const rfqId = btn.dataset.rfqId || cachedData.quoteRfqId;
          if (!rfqId) throw new Error('No RFQ selected for quotation');
          const formContainer = btn.closest('.panel')?.querySelector('[data-form="quote"]');
          const formData = collectFormData(formContainer);
          const unitPrice = parseFloat(formData.unit_price) || 18.40;
          const qty = 1000; // default qty for demo
          await api(`/rfqs/${rfqId}/quote`, {
            method: 'POST',
            body: JSON.stringify({
              total_amount: unitPrice * qty, currency: formData.currency || "CNY",
              lead_time: formData.lead_time || "3 working days",
              moq: formData.minimum_order_quantity || "100 kg",
              validity_days: 30, remarks: formData.commercial_notes || "Competitive pricing",
              items: [{ rfq_item_id: 1, unit_price: unitPrice, amount: unitPrice * qty, remarks: "" }]
            })
          });
          showToast("Quote Submitted", "Your quotation response has been recorded.");
          render();
        } else if (action === 'submit-bid') {
          showToast("Bid Submitted", "Your auction bid has been accepted.");
        } else if (action === 'create-asn') {
          const orderId = btn.dataset.orderId || cachedData.asnOrderId;
          if (!orderId) throw new Error('No confirmed PO available for ASN creation');
          const formContainer = btn.closest('.panel')?.querySelector('[data-form="asn"]');
          const formData = collectFormData(formContainer);
          const shipDate = formData.shipment_date || "2026-06-05";
          await api(`/orders/${orderId}/asn`, {
            method: 'POST',
            body: JSON.stringify({
              ship_date: shipDate, eta: shipDate, carrier: formData.carrier || "SF Express",
              tracking_no: formData.vehicle____tracking || formData.vehicle___tracking || formData['vehicle_/_tracking'] || "SF888999777", total_cartons: 50, total_pallets: 2,
              remarks: formData.packing_list || "Fresh delivery",
              lines: [{ po_line_id: 1, ship_qty: 100, batch_no: "B001", remarks: "" }]
            })
          });
          showToast("ASN Created", "Advanced Shipping Notice has been sent.");
          render();
        } else if (action === 'upload-invoice') {
          const stmId = btn.dataset.stmId || cachedData.invoiceStmId;
          if (!stmId) throw new Error('No confirmed settlement available for invoice upload');
          const formContainer = btn.closest('.panel')?.querySelector('[data-form="invoice"]');
          const formData = collectFormData(formContainer);
          const amount = parseFloat(formData.invoice_amount) || 10000;
          await api(`/settlements/${stmId}/invoice`, {
            method: 'POST',
            body: JSON.stringify({
              invoice_no: "INV-2026-099", invoice_date: "2026-05-28",
              amount: amount, tax_amount: parseFloat(formData.tax_amount) || (amount * 0.06),
              tax_rate: 0.06, currency: "CNY", attachment: "invoice_099.pdf"
            })
          });
          showToast("Invoice Uploaded", "Invoice has been submitted for OCR verification.");
          render();
        } else if (action === 'reset-data') {
          showToast("Data Reset", "All demo data has been reset to initial state.");
          render();
        } else if (action === 'export-logs') {
          showToast("Export Started", "Audit logs export is being prepared.");
        } else if (action === 'view-comparison') {
          showToast("Comparison", "Full quote comparison view would open here.");
        } else if (action === 'contract-submit') {
          const contractId = btn.dataset.id;
          await api(`/contracts/${contractId}/submit`, { method: 'POST' });
          showToast("Contract Submitted", "Contract has been submitted for approval.");
          closeDrawer();
          render();
        } else if (action === 'contract-approve') {
          const contractId = btn.dataset.id;
          await api(`/contracts/${contractId}/approve`, { method: 'POST' });
          showToast("Contract Approved", "Contract has been approved and is ready for signing.");
          closeDrawer();
          render();
        } else if (action === 'contract-return') {
          const contractId = btn.dataset.id;
          const reason = prompt("Enter return reason:") || "Returned for revision";
          await api(`/contracts/${contractId}/return`, { method: 'POST', body: JSON.stringify({ reason }) });
          showToast("Contract Returned", "Contract has been returned with feedback.");
          closeDrawer();
          render();
        } else if (action === 'contract-sign') {
          const contractId = btn.dataset.id;
          await api(`/contracts/${contractId}/sign`, { method: 'POST' });
          showToast("Contract Signed", "Contract has been signed successfully.");
          closeDrawer();
          render();
        } else if (action === 'send-dispute-message') {
          const settlementId = btn.dataset.settlementId;
          const input = document.getElementById('disputeMessageInput');
          const message = input?.value?.trim();
          if (!message) { showToast("Error", "Please enter a message"); return; }
          await api(`/settlements/${settlementId}/dispute-logs`, { method: 'POST', body: JSON.stringify({ message }) });
          showToast("Message Sent", "Your message has been added to the negotiation log.");
          input.value = '';
          openSettlementDisputeDrawer(settlementId);
        } else if (action === 'accept-dispute') {
          const settlementId = btn.dataset.settlementId;
          await api(`/settlements/${settlementId}/accept-dispute`, { method: 'POST' });
          showToast("Dispute Accepted", "Settlement amount has been adjusted.");
          closeDrawer();
          render();
        } else if (action === 'adjust-dispute') {
          const settlementId = btn.dataset.settlementId;
          const amount = prompt("Enter adjusted settlement amount:");
          if (!amount || isNaN(parseFloat(amount))) { showToast("Error", "Please enter a valid amount"); return; }
          await api(`/settlements/${settlementId}/adjust-amount`, { method: 'POST', body: JSON.stringify({ adjusted_amount: parseFloat(amount), reason: 'Partial acceptance' }) });
          showToast("Amount Adjusted", "Settlement amount has been updated.");
          closeDrawer();
          render();
        }
      } catch (e) {
        showToast("Error", e.message);
      }
    });
  });

  // Dispute button handlers
  document.querySelectorAll("[data-dispute-stm]").forEach((btn) => {
    btn.addEventListener("click", (e) => { e.stopPropagation(); openSettlementDisputeDrawer(parseInt(btn.dataset.disputeStm)); });
  });

  // Config save handlers
  document.querySelectorAll(".config-save").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.configKey;
      const input = document.querySelector(`.config-input[data-config-key="${key}"]`);
      try {
        await api(`/admin/configs/${key}`, {
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
  // Build type-specific workflow actions
  let actionButtons = '';
  if (type === 'supplier') {
    actionButtons = `<button class="primary-btn" data-workflow="approve-supplier" data-record="${record}" type="button">Approve supplier</button>
                     <button class="secondary-btn" data-workflow="return-supplier" data-record="${record}" type="button">Return for correction</button>`;
  } else if (type === 'rfq') {
    actionButtons = `<button class="primary-btn" data-workflow="award-rfq" data-record="${record}" type="button">Award to supplier</button>
                     <button class="secondary-btn" data-workflow="publish-rfq" data-record="${record}" type="button">Publish RFQ</button>`;
  } else if (type === 'order') {
    actionButtons = `<button class="primary-btn" data-workflow="confirm-order" data-record="${record}" type="button">Confirm PO</button>
                     <button class="secondary-btn" data-workflow="request-change" data-record="${record}" type="button">Request change</button>`;
  } else if (type === 'settlement') {
    actionButtons = `<button class="primary-btn" data-workflow="confirm-stm" data-record="${record}" type="button">Confirm settlement</button>
                     <button class="secondary-btn" data-workflow="dispute-stm" data-record="${record}" type="button">Raise dispute</button>`;
  } else if (type === 'asn') {
    actionButtons = `<button class="primary-btn" data-workflow="accept-asn" data-record="${record}" type="button">Accept ASN</button>
                     <button class="secondary-btn" data-workflow="exception-asn" data-record="${record}" type="button">Report exception</button>`;
  } else {
    actionButtons = `<button class="primary-btn" type="button">Continue workflow</button>`;
  }
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
      ${actionButtons}
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
      ${field("Owner", workspace === "buyer" ? "Aden Procurement" : (currentUser?.displayName || "Supplier user"))}
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
  // Workflow action handlers
  document.querySelectorAll("[data-workflow]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const workflow = btn.dataset.workflow;
      const record = btn.dataset.record;
      try {
        if (workflow === 'approve-supplier') {
          const suppliers = await api('/suppliers');
          const sp = suppliers.find(s => String(s.id) === record || record.includes(s.short_name));
          if (!sp) throw new Error('Supplier not found');
          await api(`/suppliers/${sp.id}/approve`, { method: 'POST' });
          showToast("Approved", `Supplier ${sp.short_name} has been approved.`);
        } else if (workflow === 'return-supplier') {
          const suppliers = await api('/suppliers');
          const sp = suppliers.find(s => String(s.id) === record || record.includes(s.short_name));
          if (!sp) throw new Error('Supplier not found');
          await api(`/suppliers/${sp.id}/reject`, { method: 'POST', body: JSON.stringify({ comments: "Please correct and resubmit" }) });
          showToast("Returned", `Supplier ${sp.short_name} profile returned for correction.`);
        } else if (workflow === 'award-rfq') {
          const rfqs = await api('/rfqs');
          const rfq = rfqs.find(r => record.includes(r.rfq_no));
          if (!rfq) throw new Error('RFQ not found');
          await api(`/rfqs/${rfq.id}/award`, { method: 'POST', body: JSON.stringify({ supplier_org_id: 3, amount: 44200 }) });
          showToast("Awarded", `Award created for ${rfq.rfq_no}.`);
        } else if (workflow === 'publish-rfq') {
          const rfqs = await api('/rfqs');
          const rfq = rfqs.find(r => record.includes(r.rfq_no));
          if (!rfq) throw new Error('RFQ not found');
          await api(`/rfqs/${rfq.id}/publish`, { method: 'POST' });
          showToast("Published", `RFQ ${rfq.rfq_no} has been published.`);
        } else if (workflow === 'confirm-order') {
          const orders = await api('/orders');
          const order = orders.find(o => record.includes(o.po_no));
          if (!order) throw new Error('Order not found');
          await api(`/orders/${order.id}/confirm`, { method: 'POST', body: JSON.stringify({ comments: "Confirmed as requested" }) });
          showToast("Confirmed", `PO ${order.po_no} has been confirmed.`);
        } else if (workflow === 'request-change') {
          const orders = await api('/orders');
          const order = orders.find(o => record.includes(o.po_no));
          if (!order) throw new Error('Order not found');
          await api(`/orders/${order.id}/request-change`, { method: 'POST', body: JSON.stringify({ change_type: "delivery", proposed_date: "2026-06-10", change_reason: "Need to adjust delivery", comments: "Delay request" }) });
          showToast("Change Requested", `Change request submitted for ${order.po_no}.`);
        } else if (workflow === 'confirm-stm') {
          const stms = await api('/settlements');
          const stm = stms.find(s => record.includes(s.settlement_no));
          if (!stm) throw new Error('Settlement not found');
          await api(`/settlements/${stm.id}/confirm`, { method: 'POST' });
          showToast("Confirmed", `Settlement ${stm.settlement_no} confirmed.`);
        } else if (workflow === 'dispute-stm') {
          const stms = await api('/settlements');
          const stm = stms.find(s => record.includes(s.settlement_no));
          if (!stm) throw new Error('Settlement not found');
          await api(`/settlements/${stm.id}/dispute`, { method: 'POST', body: JSON.stringify({ dispute_amount: 5000, dispute_reason: "Amount discrepancy" }) });
          showToast("Disputed", `Dispute raised for ${stm.settlement_no}.`);
        } else if (workflow === 'accept-asn') {
          const asns = await api('/orders/asns/list');
          const asn = asns.find(a => record.includes(a.asn_no));
          if (!asn) throw new Error('ASN not found');
          await api(`/orders/asns/${asn.id}/accept`, { method: 'POST' });
          showToast("Accepted", `ASN ${asn.asn_no} has been accepted.`);
        } else if (workflow === 'exception-asn') {
          const asns = await api('/orders/asns/list');
          const asn = asns.find(a => record.includes(a.asn_no));
          if (!asn) throw new Error('ASN not found');
          await api(`/orders/asns/${asn.id}/exception`, { method: 'POST', body: JSON.stringify({ exception_type: "quantity_diff", description: "Received quantity differs from ASN" }) });
          showToast("Exception Reported", `Exception recorded for ASN ${asn.asn_no}.`);
        } else {
          showToast("Workflow", "The workflow action has been recorded.");
        }
        closeDrawer();
        render();
      } catch (e) {
        showToast("Error", e.message);
      }
    });
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
      const items = notifications.slice(0, 10).map(n => timeline(n.title, n.message, formatDate(n.created_at)));
      openDrawer("Notifications", "Open tasks and alerts", `
        <div class="timeline">
          ${items.join('') || '<div class="empty">No notifications</div>'}
        </div>
        <div class="drawer-actions">
          <button class="secondary-btn" id="markAllRead" type="button">Mark all read</button>
        </div>
      `);
      document.getElementById('markAllRead')?.addEventListener('click', async () => {
        await api('/notifications/read-all', { method: 'PUT' });
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
