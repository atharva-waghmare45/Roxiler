# Store Owner Dashboard Guide

This guide documents the Store Owner's metrics dashboard, including API endpoints, database queries, frontend implementation, and test coverage.

---

## 1. Access Control

The owner dashboard endpoint requires two middleware checks:

1. **`verifyToken`** — Validates JWT from the `Authorization` header
2. **`restrictTo('STORE_OWNER')`** — Returns `403 Forbidden` for non-owner users

Route defined in: `backend/src/routes/owner.routes.js`  
Logic handled in: `backend/src/controllers/owner.controller.js`  
Database queries in: `backend/src/services/owner.service.js`

---

## 2. API Endpoint

### Get Owner Dashboard — `GET /api/owner/dashboard`

Returns all stores owned by the authenticated user along with customer review data.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `storesSortBy` | string | `name` | Sort stores by: `name`, `email`, `address`, `averageRating`, `totalRatings` |
| `storesSortOrder` | string | `asc` | Sort direction: `asc` or `desc` |
| `reviewsSortBy` | string | `ratedAt` | Sort reviews by: `userName`, `userEmail`, `userAddress`, `ratingValue`, `ratedAt`, `storeName` |
| `reviewsSortOrder` | string | `desc` | Sort direction: `asc` or `desc` |

**Response:**
```json
{
  "stores": [
    {
      "id": 1,
      "name": "Roxiler Super Market",
      "email": "super@roxiler.com",
      "address": "456 Market Plaza",
      "averageRating": 4.25,
      "totalRatings": 12
    }
  ],
  "reviews": [
    {
      "userName": "Jane Customer",
      "userEmail": "jane@example.com",
      "userAddress": "789 Home Street",
      "ratingValue": 5,
      "storeName": "Roxiler Super Market",
      "ratedAt": "2026-06-06T10:00:00.000Z"
    }
  ]
}
```

### SQL Queries

**Owned Stores Query:**
```sql
SELECT s.id, s.name, s.email, s.address,
       COALESCE(AVG(r.value), 0.0) as average_rating,
       COUNT(r.id) as rating_count
FROM stores s
LEFT JOIN ratings r ON s.id = r.store_id
WHERE s.owner_id = $1
GROUP BY s.id
ORDER BY {sortColumn} {sortDirection}
```

**Reviewers Query:**
```sql
SELECT u.name as user_name, u.email as user_email,
       u.address as user_address, r.value as rating_value,
       r.created_at as rated_at, s.name as store_name
FROM ratings r
JOIN users u ON r.user_id = u.id
JOIN stores s ON r.store_id = s.id
WHERE s.owner_id = $1
ORDER BY {sortColumn} {sortDirection}
```

### Sort Column Validation

Both queries validate `sortBy` against an **allowlist** of permitted columns to prevent SQL injection:

**Stores allowlist:** `name`, `email`, `address`, `averageRating` → `average_rating`, `totalRatings` → `rating_count`

**Reviews allowlist:** `userName` → `u.name`, `userEmail` → `u.email`, `userAddress` → `u.address`, `ratingValue` → `r.value`, `ratedAt` → `r.created_at`, `storeName` → `s.name`

---

## 3. Frontend Implementation

### 3.1 Owner Dashboard Page (`/owner`)

The owner page (`frontend/src/pages/Owner.jsx`) features:

**Metrics Summary Cards (3 cards):**

| Card | Calculation | Icon Color |
|------|-------------|------------|
| Total Stores | `stores.length` | Purple |
| Overall Avg Rating | Weighted average: `Σ(avgRating × totalRatings) / Σ(totalRatings)` | Amber |
| Total Reviews | `Σ(store.totalRatings)` | Blue |

All cards have `hover-lift` animation (translate -2px + shadow on hover).

**My Stores Section:**
- Client-side search filtering (by name, email, address)
- Server-side sorting via API query parameters
- **Mobile:** Card grid showing store name, address, email, rating, review count
- **Desktop:** Table with sortable column headers (Name, Email, Address, Avg Rating, Total Ratings)

**Customer Reviews Section:**
- Client-side search filtering (by reviewer name, email, store name)
- Server-side sorting via API query parameters
- **Mobile:** Card grid showing reviewer details, store name, rating badge, date
- **Desktop:** Table with sortable columns (Reviewer, Email, Address, Outlet, Rating, Date)
- Rating displayed as amber star badge with numeric value

### 3.2 API Integration

The page calls `getOwnerDashboard()` from `frontend/src/api/owner.js` with current sort parameters on every sort state change via a `useEffect` dependency.

Sorting is triggered by clicking table column headers, which updates state and triggers an API reload:
```js
const handleStoresSort = (field) => {
  setStoresSort((prev) => ({
    sortBy: field,
    sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
  }));
};
```

### 3.3 Design Details
- Sections wrapped in `rounded-3xl` white cards with subtle borders
- Mobile cards use `rounded-2xl bg-slate-50/50` with dividers
- Reviewer avatars shown as indigo circle icons in the desktop table
- Dates formatted with `new Date(r.ratedAt).toLocaleDateString()`
- Empty states display centered "No stores found" / "No reviews submitted yet" messages

---

## 4. Test Coverage

### Backend (`backend/src/tests/owner.test.js`)
- Store Owner can view their dashboard successfully
- Dashboard returns store details with correct average rating
- Dashboard supports sorting stores in descending order
- Dashboard supports sorting reviews by rating value ascending
- Admin can search stores by email address
- Normal user access to owner dashboard is forbidden (403)

### Frontend (`frontend/src/tests/Owner.test.jsx`)
- Renders metrics with correct weighted average calculations (e.g., `(4.5×10 + 3.0×5)/15 = 4.00`)
- Client-side search filters stores and reviews independently
- Clicking column headers triggers API reload with updated sort parameters
