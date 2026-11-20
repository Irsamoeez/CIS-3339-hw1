# CIS 3339 Homework 1 – Student Management System (Vue 3 + MongoDB)

A full-stack app for managing **students**, **courses** and **enrollments**.

- **Frontend:** Vue 3 (Composition API, `<script setup>`), Vue Router, Pinia, built with Vite
- **Backend:** Node.js + Express 5 REST API
- **Database:** MongoDB Community Edition (local) via Mongoose

The Express server serves both the REST API (`/api/...`) and the production Vue build, so the whole app runs from one `localhost` URL.

---

## Required software

| Software | Version |
| --- | --- |
| Node.js (includes npm) | 18.18 or newer (20 LTS or 22 LTS recommended) |
| MongoDB Community Edition | 6.0 or newer, running locally on the default port `27017` |
| A modern browser | Chrome, Edge, Firefox or Safari |

## Environment variables

The real `.env` file is committed in the project root. No passwords or cloud credentials are needed.

```env
MONGODB_URI=mongodb://127.0.0.1:27017/cis3339_homework1
PORT=3000
```

| Variable | Purpose | Default |
| --- | --- | --- |
| `MONGODB_URI` | Local MongoDB connection string (required) | – |
| `PORT` | Port for the Express server | `3000` |

The database `cis3339_homework1` does **not** need to exist. On startup the server creates the `students`, `courses` and `enrollments` collections and all indexes automatically.

## 1. Start MongoDB Community Edition

Start MongoDB **before** you start the app.

- **Windows:** MongoDB normally runs as the Windows service "MongoDB Server". If it isn't running, open *Services* → **MongoDB Server** → **Start**, or run in an Administrator terminal: `net start MongoDB`
- **macOS (Homebrew):** `brew services start mongodb-community`
- **Linux (systemd):** `sudo systemctl start mongod`

Check that it is running: `mongosh --eval "db.runCommand({ ping: 1 })"` should print `{ ok: 1 }`.

> If MongoDB isn't running, the server still starts. It logs a message and retries every 5 seconds, and the API answers `503` until the database is reachable.

## 2. Install dependencies

From the project root (the folder that contains this README):

```bash
npm install
```

## 3. Build the production frontend

```bash
npm run build
```

This compiles the Vue app into `frontend/dist/`.

## 4. Start the server

```bash
npm start
```

## 5. Open the app

**http://localhost:3000**

Routes: `/students`, `/courses`, `/enrollments`. You can refresh any of these pages without getting a 404.

### Quick reference

```bash
npm install
npm run build
npm start
# open http://localhost:3000
```

### Optional: development mode (hot reload)

Run these in two terminals, then open http://localhost:5173 (Vite forwards `/api` calls to port 3000):

```bash
npm run dev:server
npm run dev:client
```

---

## Features

**Students** (`/students`)
- Add a student (name, student ID, phone, ZIP) with inline validation
- Duplicate student IDs are rejected (`409`)
- Search by partial name (case-insensitive) or exact student ID
- View all students; delete a student. Deleting a student also deletes that student's enrollments.

**Courses** (`/courses`)
- Add a course (course ID, course name). Course IDs are normalized, so `cis 3339` is stored as `CIS 3339`.
- Duplicate course IDs are rejected (`409`)
- List all courses with their enrollment counts; delete a course. Deleting a course also deletes its enrollments.

**Enrollments** (`/enrollments`)
- Student and course dropdowns are loaded from the API
- Enroll a student in a course. Duplicate enrollments are blocked in the UI and rejected by the API (`409`).
- Select a course to list every enrolled student (the selection is kept in the URL, e.g. `/enrollments?course=<id>`)
- Unenroll a student from a course

Every view shows loading, empty, success (toast) and error states. The layout is responsive (tables turn into cards on phones) and the controls have labels and keyboard focus styles.

## Project structure

```
.
├── .env                      # committed local MongoDB config
├── package.json              # install / build / start scripts for the whole app
├── backend/
│   ├── server.js             # Express app: API + serves frontend/dist + history fallback
│   ├── config.js             # loads .env
│   ├── db.js                 # MongoDB connection, retry, auto-creates collections & indexes
│   ├── middleware/errors.js  # 400/404/409/503/500 JSON error handling
│   ├── models/               # Mongoose schemas: Student, Course, Enrollment
│   └── routes/               # students.js, courses.js, enrollments.js
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── public/favicon.svg
    └── src/
        ├── main.js           # creates app, installs Pinia + Router
        ├── App.vue           # layout: header, <RouterView>, toasts
        ├── router/index.js   # routes + 404 view
        ├── api/client.js     # fetch wrapper -> ApiError
        ├── stores/           # Pinia: students, courses, enrollments, notifications
        ├── components/       # reusable UI components
        ├── views/            # StudentsView, CoursesView, EnrollmentsView, NotFoundView
        ├── utils/validation.js
        └── assets/main.css
```

## Data model

| Collection | Fields | Constraints |
| --- | --- | --- |
| `students` | `name`, `studentId`, `phone`, `zip`, timestamps | `studentId` unique; all fields required and pattern-validated |
| `courses` | `courseId`, `courseName`, timestamps | `courseId` unique (stored uppercase); both required |
| `enrollments` | `student` → Student `_id`, `course` → Course `_id`, timestamps | unique compound index on `{ student, course }` |

## REST API

All responses are JSON. Errors look like `{ "error": "message", "details": { "field": "message" } }`.

| Method | Endpoint | Description | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | Server and database status | 200 | – |
| GET | `/api/students?search=` | List students, or search by name / student ID | 200 | 503 |
| GET | `/api/students/:id` | One student | 200 | 400, 404 |
| POST | `/api/students` | Create `{ name, studentId, phone, zip }` | 201 | 400, 409 |
| DELETE | `/api/students/:id` | Delete student + their enrollments | 200 | 400, 404 |
| GET | `/api/courses` | List courses with `enrollmentCount` | 200 | 503 |
| GET | `/api/courses/:id/students` | Course roster | 200 | 400, 404 |
| POST | `/api/courses` | Create `{ courseId, courseName }` | 201 | 400, 409 |
| DELETE | `/api/courses/:id` | Delete course + its enrollments | 200 | 400, 404 |
| GET | `/api/enrollments?course=&student=` | List enrollments (populated) | 200 | 400 |
| POST | `/api/enrollments` | Enroll `{ student: <_id>, course: <_id> }` | 201 | 400, 404, 409 |
| DELETE | `/api/enrollments/:id` | Unenroll | 200 | 400, 404 |

## Testing checklist

1. **Students:** add John / 1001 / 555-1234 / 77001 → search "John" → add Jane / 1002 / 555-5678 / 77002 → try ID 1001 again (rejected) → delete John.
2. **Courses:** add `CIS 3339` Enterprise Applications Development and `CIS 3368` Advanced Object-Oriented Programming → both appear → add `CIS 3339` again (rejected).
3. **Enrollments:** enroll two students in one course → try the same enrollment again (rejected) → select the course → both students listed.
4. **Cascades:** delete a student → they disappear from rosters; delete a course → its enrollments are gone (check the counts or `db.enrollments.find()`).
5. **Persistence:** stop the server (Ctrl+C), run `npm start` again, refresh → the data is still there. Inspect it with `mongosh cis3339_homework1 --eval "db.students.find()"`.

## Troubleshooting

- **"Could not connect to MongoDB" in the terminal:** MongoDB isn't running. See step 1.
- **The page says "The frontend has not been built yet":** run `npm run build`, then `npm start`.
- **Port 3000 is already in use:** stop the other process, or change `PORT` in `.env`.
