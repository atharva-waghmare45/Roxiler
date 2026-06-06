# Normal User — Store Browsing & Rating Guide

This guide documents the Normal User features including store browsing, search/sort capabilities, and the interactive star rating system.

---

## 1. Access Control

All user endpoints require two middleware checks:

1. **`verifyToken`** — Validates JWT from the `Authorization` header
2. **`restrictTo('NORMAL_USER')`** — Returns `403 Forbidden` for admin or owner users

Route defined in: `backend/src/routes/user.routes.js`  
Logic handled in: `backend/src/controllers/user.controller.js`  
Database queries in: `backend/src/services/user.service.js`

---

## 2. API Endpoints

### A. List Stores — `GET /api/user/stores`

Returns all registered stores with their overall average rating and the current user's personal rating.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Case-insensitive search on store name and address |
| `sortBy` | string | `name` | Column to sort: `name`, `address`, `average_rating` |
| `sortOrder` | string | `asc` | Sort direction: `asc` or `desc` |

**Response:**
```json
[
  {
    "id": 1,
    "name": "Roxiler Super Market",
    "email": "super@roxiler.com",
    "address": "456 Market Plaza",
    "rating": 4.25,
    "userRating": 5
  }
]
```

**SQL:** Uses `LEFT JOIN ratings` twice:
- Once grouped to compute `AVG(value)` as the overall store rating
- Once filtered by current `user_id` to retrieve the user's personal rating

---

### B. Submit/Update Rating — `POST /api/user/ratings`

Submits a new rating or updates an existing one for a specific store.

**Request Body:**
```json
{
  "storeId": 1,
  "value": 4
}
```

**Validation:**
- `value` must be an integer between 1 and 5
- `storeId` must reference an existing store

**SQL:** Uses PostgreSQL's `INSERT ... ON CONFLICT (user_id, store_id) DO UPDATE SET value = $3` for upsert behavior.

**Response:** `200` — `{ message: "Rating submitted successfully.", rating: { id, userId, storeId, value } }`

---

## 3. Frontend Implementation

### 3.1 Store Directory Page (`/`)

The store directory page (`frontend/src/pages/Stores.jsx`) features:

**Search Bar:**
- Full-width input with search icon
- Server-side filtering — typing triggers `listStores()` API call via `useEffect` dependency

**Mobile View (`< md`):**
- Card grid layout (`grid-cols-1`)
- Each card shows: store name, address (MapPin icon), email (Mail icon)
- Rating section with overall average and user's current rating
- Interactive `RatingWidget` at the bottom of each card

**Desktop View (`md+`):**
- Full table with sortable columns: Store Name, Address, Overall Rating, Your Rating, Submit/Modify Rating
- Click column headers to toggle sort direction
- User rating shown as colored pill badge (`bg-purple-50` if rated, `bg-slate-100` if unrated)

### 3.2 RatingWidget Component

An interactive 1–5 star rating input built as a reusable component:

```jsx
<RatingWidget storeId={s.id} initialRating={s.userRating} onRatingChange={fetchStoresList} />
```

**Behavior:**
1. Displays 5 star icons in a row
2. **Hover:** Stars highlight amber up to the hovered position (with scale animation)
3. **Click:** Immediately calls `submitStoreRating(storeId, value)` API
4. **On Success:** Updates internal rating state, shows success toast, calls `onRatingChange` to refresh the store list
5. **On Error:** Shows error toast with the server's error message

**Key Implementation Detail:** The `onRatingChange` callback triggers a full data refresh, so the `listStores` mock in tests must use `mockResolvedValue` (not `mockResolvedValueOnce`) to avoid returning `undefined` on subsequent renders.

### 3.3 Design Details
- Store cards use `rounded-3xl border-slate-100 shadow-xs`
- Rating section in mobile cards has a `bg-slate-50 p-3 rounded-2xl` inner box
- Star icons are `h-6 w-6` with amber fill/stroke when active
- Empty state: centered "No stores found." message
- Loading state: purple spinning circle with "Loading stores..." text

---

## 4. Test Coverage

### Backend Tests
- Store listing returns stores with computed average ratings
- Store listing supports search by name and address
- Store listing supports column sorting
- Rating submission creates new rating (value 1–5)
- Rating update modifies existing rating (upsert)
- Rating out of range (0 or 6) is rejected

### Frontend (`frontend/src/tests/Stores.test.jsx`)
- Stores render on mount with correct data
- Clicking a star in the RatingWidget triggers the `submitStoreRating` API call
