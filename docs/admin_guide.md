# Admin Dashboard & Management Guide

This guide documents the System Administrator features including user management, store registration, dashboard analytics, and data listing capabilities.

---

## 1. Access Control

All admin endpoints require two middleware checks:

1. **`verifyToken`** — Validates JWT from the `Authorization` header
2. **`restrictTo('SYSTEM_ADMIN')`** — Returns `403 Forbidden` for non-admin users

Routes defined in: `backend/src/routes/admin.routes.js`  
Logic handled in: `backend/src/controllers/admin.controller.js`  
Database queries in: `backend/src/services/admin.service.js`

---

## 2. API Endpoints

### A. Dashboard Stats — `GET /api/admin/dashboard`

Returns aggregate statistics for the entire system.

**Response:**
```json
{
  "totalUsers": 25,
  "totalStores": 8,
  "totalRatings": 120
}
```

**SQL:** Three separate `COUNT(*)` queries on `users`, `stores`, and `ratings` tables.

---

### B. List Users — `GET /api/admin/users`

Returns a filtered, sorted list of all system users.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Case-insensitive search on name, email, address |
| `role` | string | — | Filter by role (`SYSTEM_ADMIN`, `STORE_OWNER`, `NORMAL_USER`) |
| `sortBy` | string | `name` | Column to sort: `name`, `email`, `address`, `role` |
| `sortOrder` | string | `asc` | Sort direction: `asc` or `desc` |

**Special Logic:** For users with `STORE_OWNER` role, the response includes a computed `rating` field — an aggregated average rating across all stores they own.

**Response:** `Array<{ id, name, email, address, role, rating? }>`

---

### C. List Stores — `GET /api/admin/stores`

Returns a filtered, sorted list of all registered stores with their average ratings.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Case-insensitive search on name, email, address |
| `sortBy` | string | `name` | Column to sort: `name`, `email`, `address`, `average_rating` |
| `sortOrder` | string | `asc` | Sort direction: `asc` or `desc` |

**SQL:** Uses `LEFT JOIN ratings` with `COALESCE(AVG(r.value), 0.0)` to compute average rating per store.

**Response:** `Array<{ id, name, email, address, rating }>`

---

### D. Create User — `POST /api/admin/users`

Allows the admin to create users of **any role** (unlike signup which only creates `NORMAL_USER`).

**Request Body:**
```json
{
  "name": "Store Owner Account Name",
  "email": "owner@example.com",
  "address": "123 Business Street",
  "password": "SecurePass1!",
  "role": "STORE_OWNER"
}
```

**Validation:** Same rules as signup (name 20–60 chars, password 8–16 chars with uppercase + special char)

**Response:** `201` — `{ message, user: { id, name, email, role } }`

---

### E. Create Store — `POST /api/admin/stores`

Registers a new store and links it to an existing store owner.

**Request Body:**
```json
{
  "name": "Roxiler Super Market",
  "email": "super@roxiler.com",
  "address": "456 Market Plaza",
  "ownerId": 5
}
```

**Validation:**
- `ownerId` must exist in the database
- The referenced user must have the `STORE_OWNER` role
- Store email must be unique

**Response:** `201` — `{ message, store: { id, name, email, address } }`

---

## 3. Frontend Implementation

### 3.1 Admin Dashboard Page (`/admin`)

The admin page (`frontend/src/pages/Admin.jsx`) features:

**Stats Section:**
- Three metric counter cards (Total Users, Stores, Ratings) fetched from `/api/admin/dashboard`
- Cards have hover-lift animation and purple/indigo/amber color-coded icons

**Tab Controls:**
- Toggle between "Users List" and "Stores List" views
- Pill-style tabs with active state highlighting

**Users Table:**
- Searchable by name, email, or address
- Filterable by role (dropdown: All / Admin / Owner / Customer)
- Sortable by clicking column headers (Name, Email, Address, Role)
- Each row has a "Details" button opening a modal with full user info
- Store owner detail modal shows their aggregated average rating

**Stores Table:**
- Searchable by name, email, or address
- Sortable columns: Name, Email, Address, Average Rating
- Star icon with numeric rating displayed

**Add User Modal:**
- Full form with Name, Email, Address, Password, Role dropdown
- Client-side validation with toast error messages
- Auto-refreshes user list + stats on success

**Add Store Modal:**
- Form with Name, Email, Address fields
- Owner dropdown auto-populated from API (filters `STORE_OWNER` users)
- Auto-refreshes store list + stats on success

### 3.2 Design Details
- All modals use glassmorphic styling (`bg-white shadow-2xl backdrop-blur-xs`)
- Tables have `min-w-[700px]` with horizontal scroll on mobile
- Role badges are color-coded: Admin (red), Owner (indigo), Customer (emerald)

---

## 4. Test Coverage

### Backend (`backend/src/tests/admin.test.js`)
- Admin login succeeds with default credentials
- Admin can create a STORE_OWNER user
- Admin can register a store linked to the owner
- Store registration fails with non-existent owner ID
- Dashboard returns stats with non-zero counts
- Stores list contains the registered store
- Users list includes STORE_OWNER with rating info

### Frontend (`frontend/src/tests/Admin.test.jsx`)
- Stats and user table render on mount
- Clicking "Stores List" tab switches view and triggers stores API call
