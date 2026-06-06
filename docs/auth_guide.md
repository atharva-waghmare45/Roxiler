# User Authentication System Guide

This guide details the validation criteria, API endpoints, security implementation, and test coverage for the authentication features.

---

## 1. Input Validation Rules

Validators implemented in `backend/src/utils/validators.js` enforce the following rules on both frontend and backend:

| Field | Rule | Regex/Check |
|-------|------|-------------|
| **Name** | 20–60 characters | `.trim().length` check |
| **Email** | Valid email format | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| **Address** | Max 400 characters | `.trim().length` check |
| **Password** | 8–16 characters | `.length` check |
| **Password** | ≥1 uppercase letter | `/[A-Z]/` |
| **Password** | ≥1 special character | `/[!@#$%^&*(),.?":{}|<>]/` |

---

## 2. API Endpoints

All auth endpoints are defined in `backend/src/routes/auth.routes.js` and handled by `backend/src/controllers/auth.controller.js`.

### A. User Registration — `POST /api/auth/signup`

| Aspect | Detail |
|--------|--------|
| **Auth Required** | No |
| **Role Assigned** | Always `NORMAL_USER` (hardcoded) |
| **Request Body** | `{ name, email, address, password }` |
| **Success Response** | `201` — `{ message: "User registered successfully.", user: { id, name, email, role } }` |
| **Error Cases** | `400` — Validation failure; `409` — Email already registered |
| **Security** | Password hashed with `bcryptjs` (salt rounds: 10) before storage |

### B. User Login — `POST /api/auth/login`

| Aspect | Detail |
|--------|--------|
| **Auth Required** | No |
| **Request Body** | `{ email, password }` |
| **Success Response** | `200` — `{ message, token, user: { id, name, email, role } }` |
| **Token** | JWT signed with `JWT_SECRET`, payload: `{ id, role }`, expires in `24h` |
| **Error Cases** | `401` — Invalid email or password |

### C. Change Password — `POST /api/auth/change-password`

| Aspect | Detail |
|--------|--------|
| **Auth Required** | Yes (`verifyToken` middleware) |
| **Request Body** | `{ oldPassword, newPassword }` |
| **Success Response** | `200` — `{ message: "Password updated successfully." }` |
| **Validation** | New password must meet all password rules |
| **Error Cases** | `400` — Validation failure; `401` — Old password incorrect |

---

## 3. Security Implementation

### 3.1 Password Hashing
- Library: `bcryptjs`
- Salt rounds: 10
- Passwords are **never stored in plaintext** — only bcrypt hashes

### 3.2 JWT Token
- Library: `jsonwebtoken`
- Payload: `{ id: user.id, role: user.role }`
- Secret: Read from `process.env.JWT_SECRET`
- Expiry: 24 hours
- Transmitted via: `Authorization: Bearer <token>` header

### 3.3 Middleware Chain
```
verifyToken(req, res, next)
  → Extracts token from Authorization header
  → Verifies with jwt.verify()
  → Attaches decoded payload to req.user
  → Calls next() or returns 401

restrictTo(...roles)
  → Checks if req.user.role is in the allowed roles array
  → Returns 403 Forbidden if not authorized
```

---

## 4. Frontend Integration

### 4.1 Login Flow
1. User submits email + password on `/login`
2. `loginUser()` calls `POST /api/auth/login`
3. On success, `AuthContext.login(token, user)` saves to localStorage + state
4. Router redirects based on role: `SYSTEM_ADMIN` → `/admin`, `STORE_OWNER` → `/owner`, `NORMAL_USER` → `/`

### 4.2 Signup Flow
1. User fills form on `/signup` — client-side validation runs first
2. If valid, `signupUser()` calls `POST /api/auth/signup`
3. On success, toast notification shown, redirect to `/login`

### 4.3 Change Password Flow
1. User clicks "Change Password" in Navbar → modal opens
2. Client-side validation on new password
3. `changePassword()` calls `POST /api/auth/change-password`
4. Token attached automatically by Axios interceptor

---

## 5. Test Coverage

### Backend Tests (`backend/src/tests/auth.test.js`)
- Signup fails with name < 20 characters
- Signup fails with missing special character in password
- Signup fails with password < 8 characters
- Signup succeeds with valid data
- Signup fails with duplicate email
- Login fails with wrong credentials
- Login succeeds with correct credentials
- Password change fails with invalid new password
- Password change succeeds
- Login succeeds with new password

### Frontend Tests (`frontend/src/tests/Login.test.jsx`, `Signup.test.jsx`)
- Login form renders email/password fields and submit button
- Login calls API with form values
- Signup validates name length, password rules before API call
- Signup calls API on valid submission
- Signup shows navigation link to login
