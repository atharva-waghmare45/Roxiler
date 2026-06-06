# Frontend Guide — React Application

This guide documents the complete frontend implementation of the Store Rating Web Application.

---

## 1. Technology & Setup

| Aspect | Details |
|--------|---------|
| **Framework** | React 19 with JSX (no TypeScript) |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS v4 via `@tailwindcss/vite` plugin |
| **Font** | Google Fonts — Outfit (weights: 300–700) |
| **HTTP Client** | Axios with request/response interceptors |
| **Routing** | React Router DOM v7 |
| **Icons** | Lucide React |
| **Alerts** | React Toastify (theme: colored, position: top-right) |
| **Testing** | Vitest + React Testing Library + jsdom |

### Tailwind CSS v4 Configuration

No `tailwind.config.js` is needed. Tailwind v4 uses CSS-first configuration:

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --font-sans: 'Outfit', system-ui, sans-serif;
  --animate-fade-in: fade-in 0.35s ease-out;
  --animate-slide-up: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  --animate-scale-in: scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
```

The `@tailwindcss/vite` plugin is registered in `vite.config.js` to compile classes at build time.

---

## 2. Authentication Architecture

### 2.1 AuthContext Provider (`src/context/AuthContext.jsx`)

Wraps the entire application and provides:

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `user` | Object | Current user `{ id, name, email, role }` |
| `token` | String | JWT token string |
| `loading` | Boolean | `true` while reading localStorage on mount |
| `isAuthenticated` | Boolean | `!!token` |
| `login(token, user)` | Function | Saves to localStorage + state |
| `logout()` | Function | Clears localStorage + state |
| `updateUser(data)` | Function | Merges new data into user state |

**Session persistence:** On app startup, `useEffect` reads `localStorage.token` and `localStorage.user` to restore the session.

### 2.2 ProtectedRoute (`src/components/ProtectedRoute.jsx`)

A wrapper component that:
1. Reads `user`, `loading`, `isAuthenticated` from `useAuth()`
2. Shows a loading spinner while `loading` is `true`
3. Redirects to `/login` if not authenticated
4. Redirects to `/login` if user role is not in `allowedRoles` array
5. Renders `children` if all checks pass

Usage:
```jsx
<Route path="/admin" element={
  <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
    <Admin />
  </ProtectedRoute>
} />
```

### 2.3 Axios Client (`src/api/client.js`)

Pre-configured Axios instance with `baseURL: http://localhost:5000/api`:

- **Request Interceptor:** Reads `localStorage.token` and attaches `Authorization: Bearer <token>` header
- **Response Interceptor:** On `401` status, clears localStorage and redirects to `/login` (prevents infinite loops by checking current path)

---

## 3. API Client Modules

### `src/api/auth.js`
| Function | Method | Endpoint | Returns |
|----------|--------|----------|---------|
| `loginUser(email, password)` | POST | `/auth/login` | `{ token, user }` |
| `signupUser(name, email, address, password)` | POST | `/auth/signup` | `{ message }` |
| `changePassword(oldPassword, newPassword)` | POST | `/auth/change-password` | `{ message }` |

### `src/api/admin.js`
| Function | Method | Endpoint | Returns |
|----------|--------|----------|---------|
| `getDashboardStats()` | GET | `/admin/dashboard` | `{ totalUsers, totalStores, totalRatings }` |
| `listUsers(params)` | GET | `/admin/users` | `Array<User>` |
| `listStores(params)` | GET | `/admin/stores` | `Array<Store>` |
| `createUser(userData)` | POST | `/admin/users` | `{ message, user }` |
| `createStore(storeData)` | POST | `/admin/stores` | `{ message, store }` |

### `src/api/user.js`
| Function | Method | Endpoint | Returns |
|----------|--------|----------|---------|
| `listStores(params)` | GET | `/user/stores` | `Array<Store>` (with `rating`, `userRating`) |
| `submitStoreRating(storeId, value)` | POST | `/user/ratings` | `{ message, rating }` |

### `src/api/owner.js`
| Function | Method | Endpoint | Returns |
|----------|--------|----------|---------|
| `getOwnerDashboard(params)` | GET | `/owner/dashboard` | `{ stores: Array, reviews: Array }` |

---

## 4. Pages & Components

### 4.1 Login Page (`/login`)
- Glassmorphic card with `backdrop-blur-md` and `scale-in` entrance animation
- Email + Password fields with purple focus rings
- Gradient submit button with loading spinner
- Role-based redirect: `SYSTEM_ADMIN` → `/admin`, `STORE_OWNER` → `/owner`, `NORMAL_USER` → `/`
- Toast notifications for success/error

### 4.2 Signup Page (`/signup`)
- Same glassmorphic style as Login
- Four fields: Name (20–60 chars), Email, Address (max 400), Password (8–16 chars)
- Client-side validation runs before API call — toast errors shown for each rule
- Redirects to `/login` on success

### 4.3 Navbar Component
- Persistent top nav across all dashboard pages
- Brand logo (purple gradient icon + "RoxRating" text)
- User profile badge showing name + role
- "Change Password" button → opens modal dialog
- "Log Out" button → calls `logout()` from AuthContext
- Change Password modal validates: 8–16 chars, 1 uppercase, 1 special char

### 4.4 Admin Dashboard (`/admin`)
- **Stats Grid:** 3 metric cards (Total Users, Registered Stores, Ratings Submitted) with hover-lift animation
- **Tab Controls:** Toggle between Users List and Stores List
- **Users Table:** Searchable, sortable columns (Name, Email, Address, Role), "Details" modal showing full profile + owner avg rating
- **Stores Table:** Searchable, sortable columns (Name, Email, Address, Average Rating)
- **Add User Modal:** Form with role dropdown, full validation
- **Add Store Modal:** Form with store owner dropdown (auto-fetched from API)

### 4.5 Store Directory (`/`)
- **Search Bar:** Filters stores by name/address (server-side)
- **Mobile View:** Card grid with store details, overall avg, user rating, and star widget
- **Desktop View:** Table with sortable columns
- **RatingWidget:** Interactive 1–5 star component with hover preview, click → immediate API upsert, auto-refresh

### 4.6 Store Owner Dashboard (`/owner`)
- **Metrics Cards:** Total Stores, Overall Avg Rating (weighted), Total Reviews — all with hover-lift
- **My Stores Section:** Server-side sorting + client-side search, mobile cards / desktop table
- **Customer Reviews Section:** Reviewer details (name, email, address, store, rating stars, date), server-side sorting + client-side search

---

## 5. Design System

### 5.1 Color Palette
- **Primary:** Purple-600 to Indigo-600 gradient
- **Backgrounds:** Slate-50 (page), White (cards), Slate-50/50 (mobile cards)
- **Text:** Slate-900 (headings), Slate-500 (secondary), Slate-400 (labels)
- **Accents:** Amber-400/500 (stars), Red-50/600 (logout), Emerald/Indigo/Red (role badges)

### 5.2 Animations
| Class | Effect | Duration |
|-------|--------|----------|
| `animate-scale-in` | Scale 0.96→1 + fade in | 0.25s |
| `animate-slide-up` | Translate Y 12px→0 + fade in | 0.4s |
| `animate-fade-in` | Opacity 0→1 | 0.35s |
| `hover-lift` | Translate Y -2px + shadow on hover | 0.2s |

### 5.3 Responsive Breakpoints
- **Mobile (default):** Single-column card layouts, stacked search/filters
- **`sm` (640px):** Grid adjustments, side-by-side search+filter
- **`md` (768px):** Tables replace cards, desktop table headers visible
- **`lg` (1024px):** Max-width 7xl container, wider padding

---

## 6. Testing

### 6.1 Test Setup (`src/tests/setup.js`)
- Imports `@testing-library/jest-dom` for DOM matchers
- Mocks `localStorage` in jsdom environment

### 6.2 Test Files

| File | Tests | What's Verified |
|------|-------|----------------|
| `AuthContext.test.jsx` | 3 | Default state, login updates, logout clears |
| `Login.test.jsx` | 2 | Form rendering, API call on submit |
| `Signup.test.jsx` | 3 | Validation blocks, valid submit, API call |
| `Admin.test.jsx` | 2 | Stats + users load on mount, stores tab switch |
| `Stores.test.jsx` | 2 | Store listing, rating widget API interaction |
| `Owner.test.jsx` | 3 | Metrics math, search filtering, sort params |

### 6.3 Testing Patterns
- **API Mocking:** `vi.mock('../api/module')` with `vi.fn()` for each function
- **Dual DOM:** Mobile-first layouts render both card + table views — use `within(screen.getByTestId(...))` to scope queries
- **Async Loading:** `waitFor()` blocks to wait for API responses before asserting
- **Mock Refresh:** Use `mockResolvedValue` (not `Once`) when components refresh data after actions

Run all tests:
```bash
cd frontend
npm run test
```
