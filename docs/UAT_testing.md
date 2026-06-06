# User Acceptance Testing (UAT) Document

**Project:** Store Rating Web Application  
**Version:** 1.0  
**Date:** June 2026  
**Prepared By:** Development Team

---

## 1. Overview

This document provides a comprehensive set of manual User Acceptance Test (UAT) cases for the Store Rating Web Application. Testers should execute each test case in sequence, verifying expected outcomes against actual results.

### 1.1 Environment Setup

| Component | URL |
|-----------|-----|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5000` |
| Swagger Docs | `http://localhost:5000/api-docs` |

### 1.2 Prerequisites

- [ ] Backend server is running (`cd backend && npm run dev`)
- [ ] Frontend dev server is running (`cd frontend && npm run dev`)
- [ ] Database migrations have been executed (`cd backend && node src/config/db_init.js`)
- [ ] Default admin account is seeded: `admin@roxiler.com` / `AdminPassword123!`

### 1.3 Test Result Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Pass |
| ❌ | Fail |
| ⏭️ | Skipped |
| 🔄 | Blocked |

---

## 2. Module 1 — User Registration (Signup)

**Page:** `/signup`

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-001 | Access signup page | Navigate to `http://localhost:5173/signup` | Signup form is displayed with Name, Email, Address, Password fields and a "Sign Up" button | |
| TC-002 | Name too short (< 20 chars) | Enter name: `"John Doe"` (8 chars), fill other fields validly, click Sign Up | Toast error: "Name must be between 20 and 60 characters." Form is NOT submitted. | |
| TC-003 | Name too long (> 60 chars) | Enter name with 61+ characters, fill other fields validly, click Sign Up | Toast error: "Name must be between 20 and 60 characters." | |
| TC-004 | Invalid email format | Enter name: `"Johnathan Doe Test Account"`, email: `"invalid-email"`, fill others, click Sign Up | Toast error: "Invalid email address format." | |
| TC-005 | Address exceeds 400 chars | Enter valid name/email, paste 401+ character address, click Sign Up | Toast error: "Address must not exceed 400 characters." | |
| TC-006 | Password too short (< 8 chars) | Fill valid name/email/address, password: `"Ab1!"`, click Sign Up | Toast error: "Password must be between 8 and 16 characters." | |
| TC-007 | Password too long (> 16 chars) | Password: `"Abcdefghijklmnop1!"` (18 chars), click Sign Up | Toast error: "Password must be between 8 and 16 characters." | |
| TC-008 | Password missing uppercase | Password: `"password1!"`, click Sign Up | Toast error: "Password must contain at least one uppercase letter and one special character." | |
| TC-009 | Password missing special char | Password: `"Password1"`, click Sign Up | Toast error: "Password must contain at least one uppercase letter and one special character." | |
| TC-010 | Successful registration | Name: `"Test User Account Number One"`, Email: `"testuser1@example.com"`, Address: `"123 Test Street"`, Password: `"TestPass1!"` | Toast success: "Registration successful! Please login." Redirected to `/login`. | |
| TC-011 | Duplicate email registration | Repeat TC-010 with the same email | Toast error: "Email already registered." or similar server error message. | |
| TC-012 | Navigate to login | Click "Log in here" link below the form | Redirected to `/login` page. | |

---

## 3. Module 2 — User Login

**Page:** `/login`

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-013 | Access login page | Navigate to `http://localhost:5173/login` | Login form is displayed with Email, Password fields and a "Sign In" button | |
| TC-014 | Empty fields submission | Leave both fields empty, click Sign In | Toast error: "All fields are required." | |
| TC-015 | Invalid credentials | Email: `"wrong@example.com"`, Password: `"WrongPass1!"`, click Sign In | Toast error: "Login failed. Please check your credentials." or server message. | |
| TC-016 | Login as Normal User | Email: `"testuser1@example.com"`, Password: `"TestPass1!"` | Toast success. Redirected to `/` (Store Directory). Navbar shows user name and "Customer" role. | |
| TC-017 | Login as System Admin | Email: `"admin@roxiler.com"`, Password: `"AdminPassword123!"` | Toast success. Redirected to `/admin`. Navbar shows admin name and "Admin" role. | |
| TC-018 | Navigate to signup | Click "Create one here" link below the form | Redirected to `/signup` page. | |
| TC-019 | Loading state | Click Sign In with valid credentials | Button shows spinning loader during API call, then redirects. | |

---

## 4. Module 3 — Navbar & Password Change

**Precondition:** User is logged in (any role)

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-020 | Navbar displays user info | Log in and observe the navbar | Brand name "RoxRating" on left, user name + role badge on right, "Change Password" and "Log Out" buttons visible | |
| TC-021 | Open password change modal | Click "Change Password" button in navbar | Modal dialog opens with "Current Password" and "New Password" fields | |
| TC-022 | New password validation — too short | Current: `"TestPass1!"`, New: `"Ab1!"`, click Update | Toast error about password length. | |
| TC-023 | New password validation — no uppercase | Current: `"TestPass1!"`, New: `"newpass1!"`, click Update | Toast error about uppercase requirement. | |
| TC-024 | New password validation — no special char | Current: `"TestPass1!"`, New: `"NewPass12"`, click Update | Toast error about special character requirement. | |
| TC-025 | Wrong current password | Current: `"WrongOldPass1!"`, New: `"NewPass1!"`, click Update | Toast error: "Current password is incorrect." or server message. | |
| TC-026 | Successful password change | Current: `"TestPass1!"`, New: `"NewTestPass1!"`, click Update | Toast success: "Password updated successfully." Modal closes. | |
| TC-027 | Login with new password | Log out, log in with email: `"testuser1@example.com"`, password: `"NewTestPass1!"` | Login succeeds. Redirected to store directory. | |
| TC-028 | Login with old password fails | Log out, log in with email: `"testuser1@example.com"`, password: `"TestPass1!"` | Login fails with error message. | |
| TC-029 | Logout | Click "Log Out" button in navbar | Redirected to `/login`. Stored session is cleared. | |
| TC-030 | Session persistence | Log in, then close and reopen the browser tab at `http://localhost:5173` | User remains logged in (token read from localStorage). | |

---

## 5. Module 4 — System Admin Dashboard

**Precondition:** Logged in as `admin@roxiler.com` / `AdminPassword123!`  
**Page:** `/admin`

### 5.1 Dashboard Stats

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-031 | Stats counters display | Navigate to `/admin` | Three stat cards shown: "Total System Users", "Registered Stores", "Ratings Submitted" with numeric values ≥ 1 | |
| TC-032 | Stats card hover effect | Hover mouse over any stat card | Card lifts slightly (translateY -2px) with enhanced shadow | |

### 5.2 User Management

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-033 | Users table loads | Observe the "Users List" tab (default) | Table displays users with columns: Name, Email, Address, Role, Action | |
| TC-034 | Search users by name | Type a partial name in the search box | Table filters to show only matching users in real-time | |
| TC-035 | Search users by email | Type a partial email in the search box | Table filters accordingly | |
| TC-036 | Filter by role | Select "Store Owner" from the role dropdown | Only STORE_OWNER users are shown | |
| TC-037 | Sort users by name | Click the "Name" column header | Users sorted alphabetically. Click again to reverse sort. | |
| TC-038 | Sort users by email | Click the "Email" column header | Users sorted by email. Click again to toggle direction. | |
| TC-039 | View user details | Click "Details" button on any user row | Modal opens showing Full Name, Email, Address, and Role | |
| TC-040 | Store owner detail shows rating | Click "Details" on a STORE_OWNER user | Modal shows "Owner Store Avg Rating" with star icon and value | |
| TC-041 | Add user — open modal | Click "Add User" button | Modal opens with Name, Email, Address, Password, and Role dropdown fields | |
| TC-042 | Add user — validation | Enter name < 20 chars, click "Create User" | Toast error about name length. Form is not submitted. | |
| TC-043 | Add store owner user | Fill valid details, select role "Store Owner (STORE_OWNER)", click "Create User" | Toast success. Modal closes. User appears in the Users table. Stats counter increments. | |
| TC-044 | Add normal user | Fill valid details, select role "Customer (NORMAL_USER)", click "Create User" | Toast success. User created successfully. | |

### 5.3 Store Management

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-045 | Switch to stores tab | Click "Stores List" tab | View switches to show stores table with columns: Store Name, Email, Address, Average Rating | |
| TC-046 | Search stores | Type a store name or address in the search box | Table filters to matching stores | |
| TC-047 | Sort stores by rating | Click "Average Rating" column header | Stores sorted by rating. Click again to reverse. | |
| TC-048 | Add store — open modal | Click "Add Store" button | Modal opens with Store Name, Email, Address fields and an "Assign Store Owner" dropdown | |
| TC-049 | Owner dropdown population | Observe the "Assign Store Owner" dropdown | Only users with STORE_OWNER role appear in the list | |
| TC-050 | Add store — missing owner | Leave owner unselected, click "Register Store" | Toast error: "Assigned owner is required." | |
| TC-051 | Add store — success | Fill valid store details, select an owner, click "Register Store" | Toast success. Modal closes. Store appears in the Stores table. Stats counter increments. | |
| TC-052 | Stats update after additions | Observe stat cards after adding users and stores | Total Users and Registered Stores numbers have increased | |

---

## 6. Module 5 — Normal User Store Directory & Rating

**Precondition:** Logged in as a NORMAL_USER  
**Page:** `/` (root)

### 6.1 Store Browsing

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-053 | Store listings load | Navigate to `/` | Stores are displayed with name, address, overall rating, and user rating | |
| TC-054 | Search stores | Type a store name in the search bar | Results filter to matching stores | |
| TC-055 | Sort by name | Click "Store Name" column header (or sort control on mobile) | Stores sorted alphabetically | |
| TC-056 | Sort by rating | Click "Overall Rating" column header | Stores sorted by rating value | |
| TC-057 | Empty search results | Search for `"zzzznonexistent"` | "No stores found." message displayed | |

### 6.2 Star Rating Widget

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-058 | Star hover preview | Hover over the 3rd star on any store | Stars 1–3 highlight in amber color with slight scale effect | |
| TC-059 | Submit new rating | Click the 4th star on an unrated store | Toast success. Stars update to show 4 filled. "Your Rating" updates to 4. Overall rating recalculates. | |
| TC-060 | Update existing rating | Click the 2nd star on a previously rated store (was 4) | Toast success. Rating updates from 4 to 2. Stars reflect the change. Overall rating recalculates. | |
| TC-061 | Rate with value 1 | Click the 1st star | Rating submitted as 1. Minimum rating accepted. | |
| TC-062 | Rate with value 5 | Click the 5th star | Rating submitted as 5. Maximum rating accepted. | |
| TC-063 | Verify overall rating updates | After submitting a rating, check the "Overall Rating" for that store | The average rating has recalculated to include the new/updated rating | |

---

## 7. Module 6 — Store Owner Dashboard

**Precondition:** Logged in as a STORE_OWNER who owns at least one store with ratings  
**Page:** `/owner`

### 7.1 Metrics

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-064 | Metrics cards display | Navigate to `/owner` | Three metric cards shown: "Total Stores", "Overall Avg Rating", "Total Reviews" | |
| TC-065 | Total stores count | Compare card value with number of stores in "My Stores" section | Values match | |
| TC-066 | Overall avg rating accuracy | Manually compute weighted average from store ratings | Card value matches computed weighted average (rounded to 2 decimals) | |
| TC-067 | Total reviews count | Sum all "Total Ratings" from the "My Stores" section | Card value matches the sum | |
| TC-068 | Metric card hover | Hover on any metric card | Card lifts with shadow animation | |

### 7.2 My Stores Section

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-069 | Stores list displays | Scroll to "My Stores" section | All owned stores listed with Name, Email, Address, Avg Rating, Total Ratings | |
| TC-070 | Search stores | Type store name in the search box | List filters to matching stores | |
| TC-071 | Sort by name | Click "Store Name" column header | Stores sorted alphabetically (API reload triggered) | |
| TC-072 | Sort by rating | Click "Avg Rating" column header | Stores sorted by rating value | |
| TC-073 | Sort toggle | Click same column header twice | Sort direction reverses (asc → desc or vice versa) | |

### 7.3 Customer Reviews Section

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-074 | Reviews table displays | Scroll to "Customer Reviews" section | Reviews listed with Reviewer Name, Email, Address, Store, Rating, Date | |
| TC-075 | Search reviews | Type a reviewer name in the search box | List filters to matching reviews | |
| TC-076 | Sort by rating value | Click "Rating" column header | Reviews sorted by rating value | |
| TC-077 | Sort by date | Click "Rated On" column header | Reviews sorted chronologically | |
| TC-078 | Rating badge display | Observe rating values in the table | Each rating shows an amber star icon with the numeric value | |
| TC-079 | Empty reviews state | If no reviews exist, check the section | "No reviews submitted yet." message displayed | |

---

## 8. Module 7 — Role-Based Access Control

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-080 | Unauthenticated access to `/admin` | Log out, navigate to `http://localhost:5173/admin` | Redirected to `/login` | |
| TC-081 | Unauthenticated access to `/owner` | Log out, navigate to `http://localhost:5173/owner` | Redirected to `/login` | |
| TC-082 | Unauthenticated access to `/` | Log out, navigate to `http://localhost:5173/` | Redirected to `/login` | |
| TC-083 | Normal user access to `/admin` | Log in as NORMAL_USER, navigate to `/admin` | Redirected to `/login` (role mismatch) | |
| TC-084 | Normal user access to `/owner` | Log in as NORMAL_USER, navigate to `/owner` | Redirected to `/login` (role mismatch) | |
| TC-085 | Admin access to `/` | Log in as SYSTEM_ADMIN, navigate to `/` | Redirected to `/login` (role mismatch) | |
| TC-086 | Owner access to `/admin` | Log in as STORE_OWNER, navigate to `/admin` | Redirected to `/login` (role mismatch) | |
| TC-087 | API protection — admin endpoint | Send `GET /api/admin/dashboard` without token (via Swagger or curl) | `401 Unauthorized` response | |
| TC-088 | API protection — role restriction | Send `GET /api/admin/dashboard` with a NORMAL_USER token | `403 Forbidden` response | |

---

## 9. Module 8 — Responsive Design (Mobile)

**Precondition:** Use browser DevTools to resize viewport to 375px width (mobile)

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-089 | Login page on mobile | Open `/login` at 375px width | Form card is centered, fields stack vertically, no horizontal overflow | |
| TC-090 | Signup page on mobile | Open `/signup` at 375px width | All fields visible, card fits within viewport | |
| TC-091 | Admin dashboard on mobile | Open `/admin` at 375px | Stat cards stack vertically (1 column). Tab buttons and action buttons wrap properly. Tables scroll horizontally. | |
| TC-092 | Store directory on mobile | Open `/` at 375px | Stores displayed as card grid (1 column) instead of table. Search bar full width. | |
| TC-093 | Owner dashboard on mobile | Open `/owner` at 375px | Metric cards stack. Stores and reviews shown as cards, not tables. | |
| TC-094 | Navbar on mobile | Check navbar at 375px | Brand and user info visible. Buttons accessible without overflow. | |
| TC-095 | Modal on mobile | Open any modal (Add User, Change Password) at 375px | Modal fits within viewport with padding. Fields are usable. | |

---

## 10. Module 9 — Edge Cases & Error Handling

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-096 | Backend down — login | Stop the backend server, try to log in | Toast error message displayed (network error). App does not crash. | |
| TC-097 | Backend down — page load | Stop backend, navigate to `/admin` while logged in | Loading spinner appears, then toast error. Page remains functional. | |
| TC-098 | Token expiry simulation | Manually clear `localStorage.token`, then trigger any API call | User is redirected to `/login` gracefully | |
| TC-099 | Concurrent ratings | Open two browser tabs, rate the same store differently in each | Both ratings succeed. The last one wins (upsert). Refreshing shows the final value. | |
| TC-100 | Large dataset | Seed 100+ users/stores, load admin dashboard | Page loads without performance issues. Tables are scrollable. | |

---

## 11. Test Execution Summary

| Module | Total Cases | Passed | Failed | Blocked |
|--------|-------------|--------|--------|---------|
| User Registration | 12 | | | |
| User Login | 7 | | | |
| Navbar & Password Change | 11 | | | |
| Admin Dashboard | 22 | | | |
| Store Directory & Rating | 11 | | | |
| Owner Dashboard | 16 | | | |
| Role-Based Access | 9 | | | |
| Responsive Design | 7 | | | |
| Edge Cases | 5 | | | |
| **TOTAL** | **100** | | | |

---

## 12. Automated Test Results (Reference)

### Frontend Component Tests
```bash
cd frontend && npm run test
```
| File | Tests | Status |
|------|-------|--------|
| AuthContext.test.jsx | 3 | ✅ Pass |
| Login.test.jsx | 2 | ✅ Pass |
| Signup.test.jsx | 3 | ✅ Pass |
| Admin.test.jsx | 2 | ✅ Pass |
| Stores.test.jsx | 2 | ✅ Pass |
| Owner.test.jsx | 3 | ✅ Pass |
| **Total** | **15** | **✅ All Pass** |

### Backend Integration Tests
```bash
cd backend && node src/tests/api.test.js
```
| File | Tests | Status |
|------|-------|--------|
| utils.test.js | 5 | ✅ Pass |
| auth.test.js | 10 | ✅ Pass |
| admin.test.js | 7 | ✅ Pass |
| owner.test.js | 6 | ✅ Pass |
| **Total** | **28** | **✅ All Pass** |

---

## 13. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Developer | | | |
| QA Tester | | | |
| Project Manager | | | |
| Client/Stakeholder | | | |
