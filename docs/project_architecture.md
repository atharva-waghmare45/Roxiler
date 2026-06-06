# Project Architecture & Technical Overview

This document provides a comprehensive technical overview of the Store Rating Web Application — a full-stack monorepo project.

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend Framework** | React (JSX) | 19.x |
| **Build Tool** | Vite | 8.x |
| **Styling** | Tailwind CSS | v4 (CSS-first config) |
| **HTTP Client** | Axios | 1.x |
| **Routing** | React Router DOM | v7 |
| **Icons** | Lucide React | 1.x |
| **Alerts/Toasts** | React Toastify | 11.x |
| **Frontend Testing** | Vitest + React Testing Library | 4.x / 16.x |
| **Backend Runtime** | Node.js + Express.js | 18+ / 4.x |
| **Database** | PostgreSQL (Neon Serverless) | — |
| **Database Driver** | pg (node-postgres) | 8.x |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs | — |
| **API Documentation** | Swagger UI Express + OpenAPI 3.0 | — |

> **No ORM is used.** All queries are written as raw parameterized SQL via `pg.Pool`.

---

## 2. System Architecture

```
┌─────────────────────────────┐     HTTP/REST      ┌──────────────────────────┐
│     React SPA (Vite)        │ ◄──────────────────►│   Express.js API Server  │
│                             │    localhost:5173    │                          │
│  • AuthContext (JWT state)  │                     │  • JWT Middleware         │
│  • ProtectedRoute (RBAC)    │    localhost:5000    │  • Role-Based Guards     │
│  • Axios Interceptors       │                     │  • Parameterized SQL     │
│  • Tailwind CSS v4          │                     │  • Swagger UI (/api-docs)│
└─────────────────────────────┘                     └────────────┬─────────────┘
                                                                 │
                                                                 │ pg.Pool (SSL)
                                                                 ▼
                                                    ┌──────────────────────────┐
                                                    │  PostgreSQL (Neon)       │
                                                    │                          │
                                                    │  Tables: users, stores,  │
                                                    │          ratings         │
                                                    └──────────────────────────┘
```

---

## 3. Authentication & Authorization Flow

### 3.1 JWT Token Lifecycle

1. **Login** → Backend validates credentials → Returns JWT (`{ id, role }`, 24h expiry)
2. **Storage** → Frontend stores token + user object in `localStorage`
3. **Requests** → Axios interceptor auto-attaches `Authorization: Bearer <token>` header
4. **Expiry** → Axios response interceptor catches `401`, clears storage, redirects to `/login`

### 3.2 Role-Based Access Control (RBAC)

| Role | Access | Frontend Route |
|------|--------|----------------|
| `SYSTEM_ADMIN` | Manage users/stores, view dashboard stats | `/admin` |
| `NORMAL_USER` | Browse stores, submit/update ratings | `/` |
| `STORE_OWNER` | View owned store metrics and reviews | `/owner` |

**Backend enforcement:** `verifyToken` → `restrictTo(role)` middleware chain on every protected route.  
**Frontend enforcement:** `<ProtectedRoute allowedRoles={[...]}>{children}</ProtectedRoute>` wraps route elements.

---

## 4. Database Schema

### 4.1 Users Table
```sql
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(60) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,          -- bcrypt hash
  address     VARCHAR(400),
  role        VARCHAR(20) DEFAULT 'NORMAL_USER'
              CHECK (role IN ('SYSTEM_ADMIN','NORMAL_USER','STORE_OWNER')),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Stores Table
```sql
CREATE TABLE stores (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  address     VARCHAR(400),
  owner_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 Ratings Table
```sql
CREATE TABLE ratings (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  store_id    INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  value       INTEGER CHECK (value BETWEEN 1 AND 5),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, store_id)     -- One rating per user per store
);
```

> The `UNIQUE(user_id, store_id)` constraint enables **upsert** behavior — users can update their existing rating.

---

## 5. Validation Rules (Applied on Both Frontend & Backend)

| Field | Rule |
|-------|------|
| **Name** | 20–60 characters |
| **Email** | Must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| **Address** | Maximum 400 characters |
| **Password** | 8–16 characters, ≥1 uppercase letter, ≥1 special character |
| **Rating Value** | Integer between 1 and 5 |

---

## 6. Frontend Architecture

### 6.1 Component Hierarchy

```
App.jsx
├── AuthProvider (context/AuthContext.jsx)
│   └── BrowserRouter
│       ├── /login       → Login.jsx
│       ├── /signup      → Signup.jsx
│       ├── /            → ProtectedRoute[NORMAL_USER]  → Stores.jsx
│       ├── /admin       → ProtectedRoute[SYSTEM_ADMIN] → Admin.jsx
│       ├── /owner       → ProtectedRoute[STORE_OWNER]  → Owner.jsx
│       └── /*           → Redirect → /login
└── ToastContainer (react-toastify)
```

### 6.2 API Client Layer

All HTTP calls go through `src/api/client.js` (Axios instance):
- **Base URL:** `http://localhost:5000/api`
- **Request Interceptor:** Attaches JWT from `localStorage`
- **Response Interceptor:** Clears session on `401` and redirects to `/login`

Module files: `auth.js`, `admin.js`, `user.js`, `owner.js`

### 6.3 Styling Approach

- **Tailwind CSS v4** with `@tailwindcss/vite` plugin — no `tailwind.config.js` needed
- **Google Font:** Outfit (imported in `index.css`)
- **Custom CSS Animations:** `fade-in`, `slide-up`, `scale-in` keyframes
- **Utility Classes:** `hover-lift` for card hover effects, custom scrollbar styling
- **Design Pattern:** Mobile-first responsive (cards on small screens, tables on `md+`)

---

## 7. Backend Architecture

### 7.1 Layer Structure

```
Routes → Controllers → Services → Database (pg.Pool)
```

- **Routes:** Define URL patterns and attach middleware guards
- **Controllers:** Parse request data, call services, format responses
- **Services:** Execute raw parameterized SQL queries
- **Middleware:** JWT verification (`verifyToken`), role restriction (`restrictTo`)

### 7.2 API Endpoints Summary

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/auth/signup` | — | — | Register as NORMAL_USER |
| `POST` | `/api/auth/login` | — | — | Login (returns JWT + user) |
| `POST` | `/api/auth/change-password` | ✅ | Any | Update password |
| `GET` | `/api/admin/dashboard` | ✅ | ADMIN | Stats counters |
| `GET` | `/api/admin/users` | ✅ | ADMIN | List users (search, sort, filter) |
| `GET` | `/api/admin/stores` | ✅ | ADMIN | List stores (search, sort) |
| `POST` | `/api/admin/users` | ✅ | ADMIN | Create user (any role) |
| `POST` | `/api/admin/stores` | ✅ | ADMIN | Register store (link owner) |
| `GET` | `/api/user/stores` | ✅ | USER | List stores with ratings |
| `POST` | `/api/user/ratings` | ✅ | USER | Submit/update rating (1–5) |
| `GET` | `/api/owner/dashboard` | ✅ | OWNER | Owner store metrics + reviews |

### 7.3 Query Sorting & Filtering

All list endpoints support:
- **`search`** — Case-insensitive `ILIKE` across name, email, address columns
- **`sortBy`** — Column name (validated against an allowlist to prevent SQL injection)
- **`sortOrder`** — `asc` or `desc` (defaults vary by endpoint)

---

## 8. Testing Strategy

### 8.1 Frontend Tests (Vitest + jsdom)

| Test File | Coverage |
|-----------|----------|
| `AuthContext.test.jsx` | Auth state init, login action, logout action |
| `Login.test.jsx` | Form rendering, API call on submit |
| `Signup.test.jsx` | Validation rules enforcement, API call on valid submit |
| `Admin.test.jsx` | Stats loading, tab switching, stores list API call |
| `Stores.test.jsx` | Store listing, star rating widget click → API upsert |
| `Owner.test.jsx` | Metrics calculations, search filtering, sort header clicks |

Run: `cd frontend && npm run test`

### 8.2 Backend Tests (Custom test runner)

| Test File | Coverage |
|-----------|----------|
| `utils.test.js` | Email regex, password constraint validators |
| `auth.test.js` | Signup validation, login, password change flows |
| `admin.test.js` | Admin CRUD operations, dashboard stats, filters |
| `owner.test.js` | Owner dashboard, sorting, access control (403 checks) |
| `api.test.js` | Full end-to-end integration (17 assertions) |

Run: `cd backend && node src/tests/<file>.js`

---

## 9. Default Credentials

After running database migrations (`node src/config/db_init.js`):

| Role | Email | Password |
|------|-------|----------|
| System Admin | `admin@roxiler.com` | `AdminPassword123!` |
