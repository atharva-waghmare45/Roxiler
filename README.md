# Store Rating Web Application

A monorepo-based Store Rating Web Application built using React (Vite/Vanilla CSS) on the frontend and Express.js with a direct PostgreSQL connection pool on the backend.

---

## 📂 Project Structure

```text
roxiler-rating-app/
├── frontend/                     # React JS Client (Vite, Vanilla CSS)
│   ├── src/
│   │   ├── components/           # Reusable UI widgets
│   │   ├── pages/                # Dashboards and Forms
│   │   └── utils/                # Frontend helpers
├── backend/                      # Node.js Express.js server
│   ├── src/
│   │   ├── config/               # Database pool and migrations
│   │   │   └── migrations/       # Versioned SQL migration files
│   │   ├── controllers/          # Business logic handlers
│   │   ├── middlewares/          # JWT and role authorization checks
│   │   ├── routes/               # API endpoint definitions
│   │   ├── tests/                # Dedicated test suites
│   │   └── utils/                # Reusable validator utilities
├── docs/                         # Documentation guides
│   ├── swagger.yaml              # Swagger/OpenAPI 3.0 specs
│   ├── auth_guide.md             # Authentication guide
│   ├── admin_guide.md            # Admin panel guide
│   └── owner_guide.md            # Owner dashboard guide
├── backend_tickets.md            # Backend implementation tickets checklist
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
# Windows PowerShell
npm.cmd install
```

---

## 🗄️ Database Migrations

Database tables are initialized using raw SQL files executed in alphabetical order. To reset/run migrations:
```bash
# Run migrations from root
npm.cmd run dev:backend --prefix backend node src/config/db_init.js

# Or directly in backend folder
cd backend
node src/config/db_init.js
```
*Note: Running migrations automatically drops existing tables and seeds a default system administrator (`admin@roxiler.com` / `AdminPassword123!`).*

---

## 🧪 Running Tests

The application separates tests into individual functionality modules. To execute:

### Running Utility Unit Tests
```bash
cd backend
node src/tests/utils.test.js
```

### Running Authentication API Tests
```bash
cd backend
node src/tests/auth.test.js
```

### Running Admin panel API Tests
```bash
cd backend
node src/tests/admin.test.js
```

### Running Owner panel API Tests
```bash
cd backend
node src/tests/owner.test.js
```

---

## 📖 API & Flow Documentation
Refer to the following guides for detailed implementation info:
- **Swagger spec:** [swagger.yaml](file:///c:/Users/athar/Desktop/Roxiler/docs/swagger.yaml)
- **User Authentication:** [auth_guide.md](file:///c:/Users/athar/Desktop/Roxiler/docs/auth_guide.md)
- **Administrator Panel:** [admin_guide.md](file:///c:/Users/athar/Desktop/Roxiler/docs/admin_guide.md)
- **Store Owner Dashboard:** [owner_guide.md](file:///c:/Users/athar/Desktop/Roxiler/docs/owner_guide.md)
