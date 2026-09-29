const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const port = Number(process.env.PORT || 3000);

const pool = mysql.createPool({
	host: process.env.DB_HOST || "localhost",
	port: Number(process.env.DB_PORT || 3306),
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME || "due_na_diay",
	waitForConnections: true,
	connectionLimit: 10,
	dateStrings: true
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.resolve(__dirname, "..")));

const resources = {
	subjects: {
		table: "subjects",
		columns: ["name", "code", "instructor"],
		select: "id, name, code, instructor",
		values: item => [item.name, item.code, item.instructor],
		validate: item => Boolean(item.name && item.code && item.instructor)
	},
	tasks: {
		table: "tasks",
		columns: ["title", "description", "subject_id", "deadline", "priority", "status", "progress"],
		select: "id, title, description, subject_id AS subjectId, deadline, priority, status, progress",
		values: item => [
			item.title,
			item.description || null,
			Number(item.subjectId) > 0 ? Number(item.subjectId) : null,
			item.deadline || null,
			item.priority || "medium",
			item.status || "not-started",
			Math.min(100, Math.max(0, Number(item.progress) || 0))
		],
		validate: item => Boolean(item.title)
			&& ["high", "medium", "low"].includes(item.priority || "medium")
			&& ["not-started", "in-progress", "completed"].includes(item.status || "not-started")
	},
	studySessions: {
		table: "study_sessions",
		columns: ["subject_id", "topic", "session_date", "start_time", "duration"],
		select: "id, subject_id AS subjectId, topic, session_date AS date, TIME_FORMAT(start_time, '%H:%i') AS startTime, duration",
		values: item => [
			Number(item.subjectId) > 0 ? Number(item.subjectId) : null,
			item.topic,
			item.date,
			item.startTime,
			Math.max(15, Number(item.duration) || 60)
		],
		validate: item => Boolean(item.topic && item.date && item.startTime)
			&& Number(item.duration) >= 15
	}
};

function getResource(name) {
	const resource = resources[name];
	if (!resource) {
		const error = new Error("Unknown data collection.");
		error.status = 404;
		throw error;
	}
	return resource;
}

app.get("/api/:resource", async (req, res, next) => {
	try {
		const resource = getResource(req.params.resource);
		const [rows] = await pool.query(`SELECT ${resource.select} FROM ${resource.table} ORDER BY id`);
		res.json(rows);
	} catch (error) {
		next(error);
	}
});

// The client sends the current collection after each create, update, or delete.
app.put("/api/:resource", async (req, res, next) => {
	const connection = await pool.getConnection();
	try {
		const resource = getResource(req.params.resource);
		const items = req.body;
		if (!Array.isArray(items) || items.some(item => !item || !Number.isSafeInteger(Number(item.id)) || Number(item.id) < 1 || !resource.validate(item))) {
			return res.status(400).json({ error: "Expected an array of valid records with positive integer IDs." });
		}

		await connection.beginTransaction();
		const table = resource.table;
		const ids = items.map(item => Number(item.id));
		if (ids.length) {
			await connection.query(`DELETE FROM ${table} WHERE id NOT IN (${ids.map(() => "?").join(",")})`, ids);
		} else {
			await connection.query(`DELETE FROM ${table}`);
		}

		const insertColumns = ["id", ...resource.columns];
		const placeholders = insertColumns.map(() => "?").join(", ");
		const updates = resource.columns.map(column => `${column} = VALUES(${column})`).join(", ");
		const sql = `INSERT INTO ${table} (${insertColumns.join(", ")}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`;
		for (const item of items) {
			await connection.query(sql, [Number(item.id), ...resource.values(item)]);
		}

		await connection.commit();
		res.json({ saved: items.length });
	} catch (error) {
		await connection.rollback();
		next(error);
	} finally {
		connection.release();
	}
});

app.use((error, req, res, next) => {
	console.error(error);
	if (res.headersSent) return next(error);
	res.status(error.status || 500).json({ error: error.status ? error.message : "The database request failed." });
});

async function start() {
	await pool.query("SELECT 1");
	app.listen(port, () => console.log(`Due-Na-Diay running at http://localhost:${port}`));
}

start().catch(error => {
	console.error("Unable to connect to MySQL. Check the database setup and DB_* environment variables.", error.message);
	process.exitCode = 1;
});
