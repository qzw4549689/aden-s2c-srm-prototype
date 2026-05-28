# Aden S2C SRM Prototype App

A full-stack demo application for Aden's Source-to-Contract and Supplier Collaboration platform.

## Features

- **Buyer Workspace**: RFQ management, supplier lifecycle, contracts, orders, settlements
- **Supplier Portal**: Quotation, PO confirmation, ASN, invoice submission
- **Admin Console**: System configuration, audit logs, data reset
- **Business Flows**: Complete RFQ → Quote → Award → PO → ASN → Settlement → Invoice workflow
- **Task Linkage**: Cross-platform task notifications and history tracking

## Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Buyer | `buyer` | `demo123` |
| Supplier | `supplier1` ~ `supplier5` | `demo123` |
| Admin | `admin` | `demo123` |

## Local Development

```bash
npm install
npm start
```

Open http://localhost:3000

## Deploy to Vercel

```bash
npx vercel login
npx vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: In-memory (resets on restart - suitable for demo)
- **Auth**: JWT tokens
- **Frontend**: Vanilla HTML/CSS/JS
