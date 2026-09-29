# Refugio-Due-Na-Diay-tth300
29-9-2026

## MySQL setup

1. Install/start MySQL Server.
2. Import `database/schema.sql` using MySQL Workbench or the MySQL CLI. The script creates the `due_na_diay` database and its three related tables.
3. Copy `.env.example` to `.env` and set your MySQL username/password and other connection settings.
4. From the project root, run `npm install` and then `npm start`.
5. Open `http://localhost:3000` (do not open the HTML files directly from disk).

The Express API at `/api/subjects`, `/api/tasks`, and `/api/studySessions` uses the SQL database for initial data and CRUD persistence. Existing browser-storage data is copied into the database on first startup if all three SQL collections are empty. If the API/database is unavailable, the UI continues to work with browser local storage.

## SQL schema

- `subjects`: subject name, code, instructor.
- `tasks`: task details, deadline, priority, status, progress, optional subject foreign key.
- `study_sessions`: topic, date/time, duration, optional subject foreign key.

Subject removal preserves related tasks and sessions by setting their `subject_id` to `NULL`.
