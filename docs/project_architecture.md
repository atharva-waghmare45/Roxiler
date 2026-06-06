# Project Architecture & Folder Structure

This document outlines the proposed architecture and folder structure for the Store Rating Web Application, based on the FullStack Intern Coding Challenge requirements.

## 1. Tech Stack Overview

*   **Frontend:** React.js (Recommended with TypeScript and Vite for modern development)
*   **Backend:** Express.js (or Nest.js) with TypeScript
*   **Database:** PostgreSQL (Recommended) or MySQL
*   **ORM:** Prisma or TypeORM (for type-safe database interactions)

## 2. System Architecture

The application will follow a standard **Client-Server Architecture**:

*   **Client (Frontend):** A Single Page Application (SPA) built with React. It will handle the UI, routing, form validations (following the strict rules provided), and state management.
*   **Server (Backend):** A RESTful API built with Express.js/Nest.js. It will handle business logic, authentication, role-based authorization, and database operations.
*   **Database:** Relational database storing Users, Stores, and Ratings.

### 2.1 Authentication & Authorization
*   **Single Login System:** Uses JSON Web Tokens (JWT) for session management.
*   **Role-Based Access Control (RBAC):** Three distinct roles:
    1.  `SYSTEM_ADMIN`: Full access to manage users, stores, and view dashboards.
    2.  `NORMAL_USER`: Can submit and modify ratings, search/view stores.
    3.  `STORE_OWNER`: Can view users who rated their store and their average rating.

### 2.2 Core Entities (Database Schema Concept)
*   **User:**
    *   `id`, `name` (min 20, max 60 chars), `email` (unique), `password` (hashed, strict rules), `address` (max 400 chars), `role` (Enum: ADMIN, USER, OWNER).
*   **Store:**
    *   `id`, `name`, `email`, `address`, `ownerId` (Foreign Key -> User), `averageRating` (cached or calculated).
*   **Rating:**
    *   `id`, `userId` (Foreign Key -> User), `storeId` (Foreign Key -> Store), `value` (Integer 1-5).

## 3. Recommended Folder Structure

A monorepo-style structure is recommended to keep frontend and backend code tightly coupled but logically separated.

```text
roxiler-rating-app/
│
├── frontend/                     # React application
│   ├── public/                   # Static assets (favicon, index.html)
│   ├── src/
│   │   ├── assets/               # Images, global CSS
│   │   ├── components/           # Reusable UI components (Buttons, Inputs, Tables)
│   │   ├── layouts/              # Page layouts (e.g., AdminLayout, UserLayout)
│   │   ├── pages/                # Route components
│   │   │   ├── auth/             # Login, Signup
│   │   │   ├── admin/            # Admin Dashboard, User/Store Management
│   │   │   ├── user/             # Store Listings, Rating Submission
│   │   │   └── owner/            # Store Owner Dashboard
│   │   ├── hooks/                # Custom React hooks (e.g., useAuth, useFetch)
│   │   ├── services/             # API integration (Axios instance, endpoint definitions)
│   │   ├── context/              # React Context (Auth State)
│   │   ├── utils/                # Helper functions (validators, formatters)
│   │   ├── types/                # TypeScript interfaces
│   │   ├── App.tsx               # Root component and Routing
│   │   └── main.tsx              # Application entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Node.js API application
│   ├── src/
│   │   ├── controllers/          # Request handlers
│   │   ├── services/             # Business logic layer
│   │   ├── routes/               # API route definitions
│   │   ├── middlewares/          # Express middlewares (auth, validation, error handling)
│   │   ├── models/               # DB models / ORM entities
│   │   ├── utils/                # Helpers (hashing, JWT generation)
│   │   ├── config/               # Environment variables and configurations
│   │   ├── types/                # TypeScript interfaces (Requests, Responses)
│   │   └── app.ts                # App initialization
│   ├── prisma/                   # Prisma schema and migrations (if using Prisma ORM)
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                         # Project documentation
│   └── project_architecture.md
│
├── README.md                     # Main project instructions
└── .gitignore                    # Root gitignore
```

## 4. Key Design Decisions

1.  **Form Validation:** Validation rules (e.g., password constraints, length limits) should be implemented on **both** the frontend (for instant user feedback) and the backend (for data integrity and security). Libraries like `Yup` or `Zod` can be shared or mirrored.
2.  **Sorting and Filtering:** As required, tables must support sorting. The backend API should accept query parameters for sorting (e.g., `?sort=name&order=asc`) and filtering to handle this efficiently at the database level rather than loading all data into the frontend.
3.  **Average Rating Calculation:** The store's overall rating can be calculated dynamically via an SQL `AVG()` aggregation query or cached in the `Store` table and updated via database triggers or application logic whenever a new rating is submitted.
