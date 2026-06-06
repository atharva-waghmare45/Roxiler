# Store Owner Dashboard Guide

This guide documents the role-based middleware checks, route endpoint, database queries, and test assertions for the Store Owner features.

---

## 1. Middleware Checks (Role-Based Access)

To ensure that only registered store owners can access their metrics dashboard, the endpoint mapped in [owner.routes.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/routes/owner.routes.js) is protected by two secure middlewares in [auth.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/middlewares/auth.js):
1. `verifyToken` - Asserts the client has logged in and has a valid token.
2. `restrictTo('STORE_OWNER')` - Restricts access strictly to users carrying the `STORE_OWNER` role, returning a `403 Forbidden` status for normal users or other roles.

---

## 2. API Endpoint Description

The dashboard functionality is implemented in [owner.controller.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/controllers/owner.controller.js):

### Get Owner Dashboard (`GET /api/owner/dashboard`)
- **Action:** Retreives metrics for all stores owned by the logged-in owner, alongside the review feedback left by users.
- **SQL Aggregations:**
  - **Owned Store Metrics:** Queries the stores table filtering by `owner_id` and aggregates overall ratings using `COALESCE(AVG(value), 0.0)` and `COUNT(r.id)`.
  - **Review Feedbacks:** Joins the ratings, users, and stores tables to compile the list of reviewers, exposing user name, email, address, and their submitted score.

---

## 3. Dedicated Verification Tests

The integration checks verifying the store owner features are located in:
- **Owner Dashboard Test Suite:** [owner.test.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/tests/owner.test.js) (Sets up store owner accounts, registers a store, logs in a normal user to leave a review, queries the owner dashboard, and asserts calculations match exactly).
