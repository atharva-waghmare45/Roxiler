---
name: store-rating-development
description: >-
  Provides guidelines, architectural context, and git workflow instructions for developing the Store Rating Web Application.
---

# Store Rating Development Skill

This skill contains the core architectural context for the Store Rating Web Application and specifies a regular Git commit protocol to ensure progress tracking.

## 1. Project Context & Guidelines

- **Architecture:** Client-Server Monorepo.
  - **Frontend:** React JS, Vite, Vanilla CSS. Strict avoidance of Tailwind CSS.
  - **Backend:** Express.js (Node.js), standard CommonJS (`require`).
  - **Database:** PostgreSQL. Interacted with directly using the `pg` connection pool (`pg.Pool`), executing clean raw SQL queries. No ORMs (such as Prisma or TypeORM).
- **Design Philosophy:** Keep logic simple, clear, and direct. The codebase should resemble a clean, high-quality project authored by a junior/fresher developer. Avoid heavy abstractions, nested wrappers, or overly complex pattern engineering.

---

## 2. Git Commit Protocol (Every 15 Minutes)

To maintain a robust commit history, you must capture incremental progress. Every 15 minutes of active development, or upon completing a logical functionality, perform the following Git sequence:

### Step 1: Check Current Status
Verify what files have been modified or created:
```bash
git status
```

### Step 2: Stage Incremental Changes
Stage only the files related to the finished functionality:
```bash
git add <path/to/modified/file>
```
*Note: Avoid running `git add .` if it stages unrelated incomplete work.*

### Step 3: Create a Descriptive Commit
Commit with a concise commit message detailing the exact work done in the last 15 minutes. Use simple prefix styles:
- `feat: add login validation logic`
- `style: implement sidebar dashboard navigation`
- `fix: resolve pg pool connection timeout issue`

```bash
git commit -m "<type>: <brief description of changes>"
```

### Step 4: Verify History
Ensure the commit was recorded successfully:
```bash
git log -n 1
```
