# 🏠 PropertyHub — Multi-Tenant Property & Rental Management System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Async%20Motor-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, production-ready, full-stack **Multi-Tenant Property and Rental Management SaaS Platform**. Built with **FastAPI**, **Motor (Async MongoDB)**, **React 19**, and **TypeScript**, PropertyHub streamlines property administration, tenant onboarding, automated rent invoicing, digital agreements, maintenance ticket tracking, and multi-organization governance under a single unified platform.

---

## 🌟 Key Highlights & Role-Based Portals

PropertyHub comes with dedicated role-based workflows and interfaces for **Platform Super Admins**, **Property Owners / Landlords**, and **Tenants**.

```
                        ┌─────────────────────────────────────────┐
                        │        PropertyHub SaaS Platform        │
                        └────────────────────┬────────────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
    🛡️ Super Admin Portal          🏢 Owner / Landlord Portal       👤 Tenant Portal
   • Multi-Tenant Governance      • Property & Unit Management    • Rent Payments & History
   • Organizations & Owners       • Automated Rent Generation     • Maintenance Requests
   • System Audit Logs            • Tenant Lifecycle & Leases     • Digital Agreements
   • Platform Settings & Health   • Expenses & Financial Reports  • Announcements & Docs
```

---

### 🛡️ 1. Super Admin Portal
- **Organization Management**: Create, view, suspend, and configure multi-tenant organizations with custom domain/branding settings and subscription tiers.
- **Owner Governance**: Manage landlord accounts, view assigned properties, and monitor organization metrics.
- **Audit Logging**: Real-time audit trails of critical system actions, authentication events, and administrative activities.
- **System Settings & Health**: Configure global platform settings, feature flags, and storage parameters.

---

### 🏢 2. Property Owner & Landlord Portal
- **Property & Unit Management**:
  - Add and manage multiple buildings/properties across different locations.
  - Granular unit/room management (floor numbers, rent amounts, security deposits, occupancy status).
- **Tenant Lifecycle Management**:
  - Onboard tenants with identity proof verification, contact details, emergency contacts, and move-in/move-out tracking.
  - Digital rental agreements with lease start/end dates and rent escalation clauses.
- **Automated Billing & Invoicing**:
  - One-click monthly rent invoice generation (idempotent, prevents duplicate billing).
  - Record payments via cash, UPI, bank transfer, or online methods.
  - Download and export automated PDF payment receipts and rent invoices.
- **Maintenance & Operations**:
  - Receive maintenance tickets with priority levels (Low, Medium, High, Emergency) and photo attachments.
  - Update ticket status (*Pending*, *In Progress*, *Resolved*, *Closed*) and assign vendors/costs.
- **Expenses & Financial Reporting**:
  - Track property expenses by category (Maintenance, Utilities, Taxes, Insurance, Miscellaneous).
  - Income vs. expense analytics, rent collection efficiency charts, and cash flow breakdowns.
- **Communication & Documents**:
  - Broadcast announcements to all tenants or specific property residents.
  - Centralized document repository for lease deeds, KYC documents, and compliance records.

---

### 👤 3. Tenant Self-Service Portal
- **Personal Dashboard**: Instant view of active lease, unit details, upcoming rent dues, and payment deadlines.
- **Rent Payments & Receipts**: View payment history and instantly download PDF rent receipts.
- **Maintenance Ticketing**: Submit repair requests with issue description, photos, and preferred inspection time; track live status updates.
- **Lease & Documents**: Access signed rental agreements, house rules, and landlord announcements.
- **Profile & Notifications**: Manage emergency contacts, communication preferences, and in-app alerts.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+) — High-performance, async REST API with automatic OpenAPI / Swagger documentation.
- **Database**: [MongoDB](https://www.mongodb.com/) via [Motor](https://motor.readthedocs.io/) (Async Python driver) with aggregate pipelines.
- **Authentication**: JWT (JSON Web Tokens) with `OAuth2PasswordBearer`, `python-jose`, and `passlib[bcrypt]`.
- **Validation & Serialization**: [Pydantic v2](https://docs.pydantic.dev/) & `pydantic-settings`.
- **Document & PDF Generation**: `WeasyPrint`, `ReportLab`, and `Pillow`.
- **Email & Caching**: `aiosmtplib`, `redis` (optional).
- **Testing**: `pytest`, `pytest-asyncio`, `httpx`.

### **Frontend**
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/).
- **Routing**: `react-router-dom` v7 with lazy loading and protected route guards.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4 with custom responsive design tokens, glassmorphism, and dark/light themes.
- **State & Data Fetching**: `@tanstack/react-query` & `Axios` with centralized interceptors.
- **UI Components**: `@radix-ui` primitives, [Lucide React](https://lucide.dev/) icons, [Framer Motion](https://www.framer.com/motion/) animations.
- **Forms & Validation**: `react-hook-form` + `zod` schema validation.
- **Charts & PDF**: `recharts` for financial visualizations, `jspdf` & `html2canvas` for client-side receipt downloads.

---

## 📁 Repository Structure

```text
House-Management-system/
├── .env.example                # Sample global environment variables
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/         # REST API endpoints (auth, properties, rent, tenants, etc.)
│   │   │   └── deps.py         # Authentication & tenancy dependencies
│   │   ├── config/             # Pydantic environment configuration
│   │   ├── core/               # Security, password hashing, JWT utils
│   │   ├── database/           # MongoDB async connection manager
│   │   ├── models/             # Pydantic domain models & schemas
│   │   ├── services/           # Business logic & background jobs
│   │   └── main.py             # FastAPI application entrypoint & middleware
│   ├── tests/                  # Pytest test suite (multi-tenancy, auth, routes)
│   ├── migrate_multitenant.py  # Single-to-multi-tenant DB migration script
│   ├── run.py                  # Backend development server launcher
│   ├── seed.py                 # Database initialization & mock data seeder
│   └── requirements.txt        # Python backend dependencies
└── frontend/
    ├── public/                 # Static assets & icons
    ├── src/
    │   ├── api/                # Axios client & typed API endpoints
    │   ├── assets/             # Images, illustrations, and SVG graphics
    │   ├── components/         # Shared UI components, layout shells, modals
    │   │   ├── layout/         # OwnerShell, TenantShell, SuperAdminShell
    │   │   ├── navigation/     # Sidebar, bottom nav, mobile headers
    │   │   ├── properties/     # Property/unit modals & cards
    │   │   └── ui/             # Badges, buttons, dialogs, dropdowns
    │   ├── contexts/           # AuthContext & ToastContext
    │   ├── pages/              # Application views by role
    │   │   ├── auth/           # Login & password reset
    │   │   ├── superadmin/     # Organizations, audit logs, owners, dashboard
    │   │   ├── owner/          # Properties, units, tenants, rent, expenses, reports
    │   │   ├── tenant/         # Tenant dashboard, payments, agreements, tickets
    │   │   └── shared/         # Notifications, user profile, settings
    │   ├── types/              # Global TypeScript interfaces & types
    │   ├── utils/              # PDF receipt generators, formatters, date helpers
    │   ├── App.tsx             # Root router & role-based route guards
    │   ├── index.css           # Global Tailwind CSS styles & themes
    │   └── main.tsx            # React application entrypoint
    ├── package.json            # Node dependencies and scripts
    └── vite.config.ts          # Vite configuration with PWA support
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: v18.0 or higher ([Download Node.js](https://nodejs.org/))
- **Python**: v3.11 or higher ([Download Python](https://www.python.org/))
- **MongoDB**: Community or Atlas cluster ([MongoDB Community](https://www.mongodb.com/try/download/community))
- **Git**: For version control

---

### ⚙️ 1. Clone the Repository
```bash
git clone https://github.com/adhi107/House-Management-system.git
cd House-Management-system
```

---

### 🐍 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   # Copy sample .env from root or create in backend directory
   cp ../.env.example .env
   ```
   *Make sure `MONGODB_URL` points to your running MongoDB instance (e.g., `mongodb://localhost:27017`).*

5. Seed the database with demo accounts and data:
   ```bash
   python seed.py
   ```

6. Start the FastAPI development server:
   ```bash
   python run.py
   # Or directly with uvicorn:
   # uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   API will be running at **`http://localhost:8000`**  
   Interactive Swagger docs: **`http://localhost:8000/api/docs`**  
   ReDoc alternative docs: **`http://localhost:8000/api/redoc`**

---

### 💻 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure frontend environment variables (optional if using default `http://localhost:8000/api/v1`):
   Create a `.env` file in `frontend/`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   VITE_APP_NAME=PropertyHub
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend will be accessible at **`http://localhost:5173`**

---

## 🔑 Demo & Test Credentials

After running `python seed.py`, the following demo accounts are available:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@propertyhub.dev` | `ChangeMe123!` | Platform administration, all organizations & logs |
| **Property Owner A** | `owner@propertyhub.dev` | `ChangeMe123!` | Active Landlord (Apex Living Organization) |
| **Property Owner B** | `owner2@propertyhub.dev` | `ChangeMe123!` | Active Landlord (BlueHorizon Estates) |
| **Tenant A** | `tenant@propertyhub.dev` | `ChangeMe123!` | Tenant in Apex Living (Building 1) |
| **Tenant B** | `tenant2@propertyhub.dev` | `ChangeMe123!` | Tenant in BlueHorizon Estates |

---

## 🧪 Running Tests

To run the backend test suite verifying multi-tenancy isolation and API routes:

```bash
cd backend
pytest -v
```

---

## 🔒 Security & Multi-Tenancy Architecture

- **Tenant Isolation**: Every database operation enforces strict tenancy scoping via `organization_id` filters, preventing cross-tenant data leakage.
- **Secure Password Hashing**: Passwords are encrypted using standard `bcrypt` with random salt.
- **Stateless Authentication**: Access tokens (JWT) signed with HMAC-SHA256 and configurable expiration.
- **CORS Protection**: Whitelisted origin headers configurable via `.env`.
- **Role-Based Guards**: Protected endpoints and UI views requiring specific user scopes (`super_admin`, `owner`, `tenant`).

---

## 🤝 Contributing

Contributions are welcome! Follow these steps to contribute:

1. **Fork** the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m "feat: Add amazing feature"`.
4. Push to the branch: `git push origin feature/amazing-feature`.
5. Open a **Pull Request**.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
