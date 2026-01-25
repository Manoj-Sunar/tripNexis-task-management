# 🧠 Task Management System API

A **Task Management REST API** built with **NestJS, TypeORM, PostgreSQL, JWT Authentication**, and **Role-Based Access Control**.  
Admins manage users and tasks, while users can view and update only their assigned tasks.

---

## 🚀 Features

- JWT Authentication (Register / Login)
- Role-Based Authorization (Admin / User)
- User Management (Admin only)
- Task Management with Status & Priority
- Assign tasks to users
- Search tasks by title
- Docker & Docker Compose support

---

## 🛠️ Tech Stack

- **Backend:** NestJS
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Authentication:** JWT + bcrypt
- **Containerization:** Docker, Docker Compose

---

## 📂 Database Entities

### User Entity
- `id` (UUID)
- `name`
- `email` (unique)
- `password`
- `role` (default: `user`)
- `createdTasks`
- `assignedTasks`
- `createdAt`
- `updatedAt`

### Task Entity
- `id` (UUID)
- `title`
- `description`
- `status` (`TODO | IN_PROGRESS | DONE`)
- `priority` (`LOW | MEDIUM | HIGH`)
- `dueDate`
- `createdBy` (User)
- `assignedTo` (User | null)
- `createdAt`
- `updatedAt`

---

## 👥 Roles & Permissions

| Role | Permissions |
|-----|------------|
| **Admin** | Manage users, create/update/delete tasks |
| **User** | View assigned tasks, update task status, manage own profile |

---

## 🔐 Authentication APIs

### Register
POST http://localhost:5000/users/register

### Login
POST http://localhost:5000/users/login


---

## 👤 User APIs

| Action | Method | Endpoint | Access |
|------|------|---------|-------|
| Get own profile | GET | `/users/user-profile/:id` | Logged-in User |
| Update own profile | PUT | `/users/login-user-edit/:id` | Logged-in User |
| Update user role | PUT | `/users/role-update/:id` | Admin |
| Delete user | DELETE | `/users/user-delete/:id` | Admin |

---

## 📋 Task APIs

| Action | Method | Endpoint | Access |
|------|------|---------|-------|
| Create task | POST | `/task/create-task` | Admin |
| Get all tasks (search by title) | GET | `/task/get-alltask?search=title` | Admin |
| Get task by ID | GET | `/task/taskBy-id/:id` | Admin |
| Update task | PUT | `/task/update-task/:id` | Admin |
| Delete task | DELETE | `/task/delete-task/:id` | Admin |
| Get assigned tasks | GET | `/task/user-assign-task/:userId?status=IN_PROGRESS` | User |
| Update task status | PATCH | `/task/update-status/:id` | User |

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
REDIS_HOST=my-redis
REDIS_PORT=6379

DB_HOST=aws-1-ap-south-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres.pfnykxqkzktixpcgnpcs
DB_PASSWORD=Task@management12
JWT_SECRET=jo30u045ul43jtrl3jfvodv90u9043u5o43jn5lo3rlofvj


