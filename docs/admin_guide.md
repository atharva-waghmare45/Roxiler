# Admin User & Store Management Guide

This guide documents the role-based validation, route endpoints, query builders, and test flows for the Administrator Panel features.

---

## 1. Middleware Checks (Role-Based Access)

To ensure that only system administrators can execute management actions, all endpoints mapped in [admin.routes.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/routes/admin.routes.js) are wrapped by two secure middlewares in [auth.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/middlewares/auth.js):
1. `verifyToken` - Asserts user has logged in and has a valid token.
2. `restrictTo('SYSTEM_ADMIN')` - Rejects the request with a `403 Forbidden` status if the authenticated user's role is not `SYSTEM_ADMIN`.

---

## 2. API Endpoints Description

The core actions implemented in [admin.controller.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/controllers/admin.controller.js) comprise:

### A. Create User (`POST /api/admin/users`)
- **Action:** Allows the administrator to seed users of any role (`SYSTEM_ADMIN`, `STORE_OWNER`, or `NORMAL_USER`).
- **Validations:** Runs the same validator checks as the signup process.

### B. Create Store (`POST /api/admin/stores`)
- **Action:** Registers a store.
- **Constraints:** Validates that the assigned `ownerId` exists in the database and is matching the `STORE_OWNER` role.

### C. Dashboard Metrics (`GET /api/admin/dashboard`)
- **Action:** Runs count queries for users, stores, and ratings, returning them as a unified counts payload.

### D. User and Store Lists (`GET /api/admin/users` & `GET /api/admin/stores`)
- **Filtration:** Supports case-insensitive searching using SQL `ILIKE` operators (on names, emails, addresses).
- **Sorting:** Supports sorting lists dynamically based on custom query parameters (`sortBy`, `sortOrder`).
- **Aliased Calculations:**
  - When querying `users` of role `STORE_OWNER`, the controller runs a subquery joining stores and ratings to return the owner's aggregated average rating directly.
  - When querying `stores`, the controller aggregates the store's overall rating using an SQL `COALESCE(AVG(value), 0.0)` block grouped by the store id.

---

## 3. Dedicated Verification Tests

The unit and integration checks verifying the administrator features are located in:
- **Admin API Test Suite:** [admin.test.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/tests/admin.test.js) (Spins up the app on port 5002, verifies admin authentication, owner registration, store linking, dashboard stats retrieval, and filters).
