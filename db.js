const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS doctors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, is_present INTEGER DEFAULT 1)`);
    
    // Appointments now tracks if a morning reminder was sent
    db.run(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT,
        doctor_id INTEGER,
        appointment_time DATETIME,
        status TEXT DEFAULT 'booked',
        fee INTEGER DEFAULT 0,
        reminded INTEGER DEFAULT 0,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id)
    )`);

    // Level 2 Twist: Notification Service Outbox
    db.run(`CREATE TABLE IF NOT EXISTS outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Safely patch existing tables if they lack the new columns
    db.run(`ALTER TABLE appointments ADD COLUMN reminded INTEGER DEFAULT 0`, (err) => {});

    db.get("SELECT COUNT(*) AS count FROM doctors", (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT INTO doctors (name) VALUES ('Dr. Smith'), ('Dr. Adams'), ('Dr. Lee')`);
        }
    });
});
module.exports = db;
