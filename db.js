const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Front Desk Staff Auth
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    // Doctors (includes ERP attendance tracking)
    db.run(`CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        is_present INTEGER DEFAULT 1
    )`);

    // Safely attempt to add column if upgrading an older database
    db.run(`ALTER TABLE doctors ADD COLUMN is_present INTEGER DEFAULT 1`, (err) => {});

    // Appointments (tracks status and fees)
    db.run(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT,
        doctor_id INTEGER,
        appointment_time DATETIME,
        status TEXT DEFAULT 'booked',
        fee INTEGER DEFAULT 0,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id)
    )`);

    // Seed initial doctors
    db.get("SELECT COUNT(*) AS count FROM doctors", (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT INTO doctors (name) VALUES ('Dr. Smith'), ('Dr. Adams'), ('Dr. Lee')`);
        }
    });
});

module.exports = db;