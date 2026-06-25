# Srimaan Solar - Agent Management System

A complete SaaS-style web application for managing solar sales agents, tracking customer lead lifecycles, generating district/revenue reports, and configuring white-label company branding.

---

## 🚀 Quick Start Instructions

Because we designed the database system with a **Transparent Fallback Database**, you can run the entire application **immediately** without setting up MongoDB! 

### 1. Start the Express Backend
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Start the development server:
   ```bash
   npm start
   ```
   *Note: The server will automatically connect to MongoDB if it is running on your system. If Docker/MongoDB is down, the server will fall back to local JSON files stored under `backend/data/` for full data operations (CRUD, login, seeding, backups).*

### 2. Start the React Frontend
1. Open a new terminal in the root directory (`saas/`).
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open the shown link (usually `http://localhost:5173`) in your web browser.

---

## 🔑 Default Credentials

### 1. Admin Login
* **Username**: `Srimaan_solar`
* **Password**: `srimaan$123`

### 2. Sample Agent Logins (Pre-seeded)
All 10 sample agents are pre-seeded with the password **`agent$123`**:
1. **Ravi Kumar** — Username: `ravi_kumar`
2. **Suresh Reddy** — Username: `suresh_reddy`
3. **Mahesh Babu** — Username: `mahesh_babu`
4. **Praveen Kumar** — Username: `praveen_kumar`
5. **Kiran Kumar** — Username: `kiran_kumar`
6. **Srinivas Rao** — Username: `srinivas_rao`
7. **Rajesh Naidu** — Username: `rajesh_naidu`
8. **Ganesh Kumar** — Username: `ganesh_kumar`
9. **Venkatesh Reddy** — Username: `venkatesh_reddy`
10. **Harish Kumar** — Username: `harish_kumar`

---

## 📦 Features Checklist

* **Dual-Role Dashboards**: Admins oversee everything; agents only see their assigned customers and personal analytics charts.
* **Customer Lifecycle Timeline**: Complete tracking of lead status changes (New Lead → Site Inspection → Document Verification → Installed).
* **Mock Aadhaar Verification Module**: Verifies Aadhaar digits check and simulates verification request handshake with the UIDAI registry.
* **Branding Settings**: Dynamic White-Labeling (Admins can update company name and logo immediately across all screens).
* **Reports Exporter**: Generates reports (Agent, District, Installation) with exporters for PDF, CSV, and Multi-Tab Excel spreadsheets.
* **Database Snapshots**: Complete database backup (JSON file download) and restore (file upload restoration).
* **Security & Logs**: Cryptographic password hashing (bcrypt), RBAC token protection (JWT), and system audit logs.
* **PWA Capability**: Offline caching support and browser-installable home banner.
