# User Authentication System Guide

This guide details the validation criteria, route definitions, controllers, and test suites implemented for the Store Rating User Authentication features.

---

## 1. Input Validation Rules

To protect database integrity and provide clear frontend feedback, the validators implemented in [validators.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/utils/validators.js) enforce the following rules:

- **Name Constraints:**
  - Length must be between `20` and `60` characters (enforced in signup controller).
- **Address Constraints:**
  - Length must not exceed `400` characters.
- **Email Validation:**
  - Evaluated against standard regex pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Password Constraints:**
  - Length must be between `8` and `16` characters.
  - Must include at least one uppercase letter (checked via `/[A-Z]/`).
  - Must include at least one special character (checked via `/[!@#$%^&*(),.?":{}|<>]/`).

---

## 2. API Endpoint Implementations

The endpoints are declared in [auth.routes.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/routes/auth.routes.js) and bound to actions inside [auth.controller.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/controllers/auth.controller.js):

### A. Signup Route (`POST /api/auth/signup`)
- **Action:** Creates a new database row in the `users` table.
- **Constraints:** Hardcoded to assign the `NORMAL_USER` role. Guest logins cannot specify their role on registration.
- **Security:** Hashes the password using `bcryptjs` before storage.

### B. Login Route (`POST /api/auth/login`)
- **Action:** Compares inputted password with DB hash.
- **Payload:** Issues a 24-hour expiration JWT containing `{ id, role }` signed using the `JWT_SECRET` key from the backend environment.

### C. Password Reset Route (`POST /api/auth/change-password`)
- **Access:** Protected by the `verifyToken` middleware in [auth.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/middlewares/auth.js).
- **Action:** Validates constraints on the new password, checks current password validity, and updates the database row.

---

## 3. Dedicated Verification Tests

The unit and integration checks verifying the authentication features are housed in:
- **Validators Unit Tests:** [utils.test.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/tests/utils.test.js) (Runs assertions on email formats and password requirements).
- **Authentication API Tests:** [auth.test.js](file:///c:/Users/athar/Desktop/Roxiler/backend/src/tests/auth.test.js) (Fires E2E requests on port 5001 checking validation failures, successful login, token issuance, and password changes).
