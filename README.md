rem# Store Rating Web Application

A monorepo-based Store Rating Web Application built using React (Vite + Tailwind CSS v4) on the frontend and Express.js with a direct PostgreSQL connection pool on the backend.

---

## 📂 Project Structure

```text
roxiler-rating-app/
├── frontend/                     # React JS Client (Vite, Tailwind CSS v4)
│   ├── src/
│   │   ├── api/                  # Axios API client modules (auth, admin, user, owner)
│   │   ├── components/           # Reusable UI widgets (Navbar, ProtectedRoute)
│   │   ├── context/              # AuthContext provider
│   │   ├── pages/                # Login, Signup, Admin, Stores, Owner
│   │   ├── tests/                # Vitest + React Testing Library component tests
│   │   └── utils/                # Frontend helpers
├── backend/                      # Node.js Express.js server
│   ├── src/
│   │   ├── config/               # Database pool and migrations
│   │   │   └── migrations/       # Versioned SQL migration files
│   │   ├── controllers/          # Business logic handlers
│   │   ├── middlewares/          # JWT and role authorization checks
│   │   ├── routes/               # API endpoint definitions
│   │   ├── services/             # Data access layer
│   │   ├── tests/                # Dedicated test suites
│   │   └── utils/                # Reusable validator utilities
├── docs/                         # Documentation guides
│   ├── swagger.yaml              # Swagger/OpenAPI 3.0 specs
│   ├── auth_guide.md             # Authentication guide
│   ├── admin_guide.md            # Admin panel guide
│   └── owner_guide.md            # Owner dashboard guide
├── backend_tickets.md            # Backend implementation tickets checklist
├── frontend_tickets.md           # Frontend implementation tickets checklist
└── package.json                  # Workspaces configuration
```

---

## ⚙️ Local Setup Instructions

### 1. Prerequisites
- Node.js (version 18 or higher)
- PostgreSQL database (e.g. Neon serverless instance)

### 2. Configure Environment Variables
Create a `.env` file under the `backend/` directory:
```bash
# backend/.env
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require"
PORT=5000
JWT_SECRET="your-jwt-secret-key"
```

### 3. Install Workspace Dependencies
Install dependencies for both frontend and backend workspaces from the root folder:
```bash
npm install
```

---

## 🚀 Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
# Swagger docs at http://localhost:5000/api-docs
```

### Start Frontend Dev Server
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

## 🌐 Live Demo & Credentials

**Live Application:** [https://roxiler-ui.onrender.com](https://roxiler-ui.onrender.com)

### Login Credentials

Please refer to the [login_credentials.md](./login_credentials.md) file in the root directory for the complete list of testing credentials for all user roles (Admin, Normal User, Store Owner).

---

## 🗄️ Database Migrations

Database tables are initialized using raw SQL files executed in alphabetical order. To reset/run migrations:
```bash
cd backend
node src/config/db_init.js
```
*Note: Running migrations automatically drops existing tables and seeds a default system administrator.*

---

## 🧪 Running Tests

### Frontend Component Tests (Vitest)
```bash
cd frontend
npm run test
```
Runs 6 test files covering AuthContext, Login, Signup, Admin, Stores, and Owner components.

### Backend Integration Tests
```bash
cd backend
node src/tests/utils.test.js     # Utility unit tests
node src/tests/auth.test.js      # Auth API tests
node src/tests/admin.test.js     # Admin panel API tests
node src/tests/owner.test.js     # Owner panel API tests
node src/tests/api.test.js       # Full integration test suite
```

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, Axios, React Router v7, React Toastify, Lucide Icons |
| Backend | Node.js, Express.js, PostgreSQL (pg), JWT (jsonwebtoken), bcrypt, Swagger UI |
| Testing | Vitest + React Testing Library (frontend), Custom test runner (backend) |

---

## 📖 API & Flow Documentation
Refer to the following guides for detailed implementation info:
- **Swagger spec:** `docs/swagger.yaml`
- **User Authentication:** `docs/auth_guide.md`
- **Administrator Panel:** `docs/admin_guide.md`
- **Store Owner Dashboard:** `docs/owner_guide.md`
