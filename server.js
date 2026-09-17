const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./db');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const SECRET = "auriga-secret-key-2026";

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

// FIXED: Registration empty field validation
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || username.trim() === '' || password.trim() === '') {
        return res.status(400).json({ error: 'Staff ID and Password cannot be empty' });
    }
    const hash = bcrypt.hashSync(password, 8);
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hash], function(err) {
        if (err) return res.status(400).json({ error: 'This Staff ID already exists' });
        res.json({ message: 'User registered successfully. You can now login.' });
    });
});

// FIXED: Login empty field validation
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || username.trim() === '' || password.trim() === '') {
        return res.status(400).json({ error: 'Please enter your Staff ID and Password' });
    }
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
        res.json({ token: jwt.sign({ id: user.id }, SECRET, { expiresIn: '2h' }) });
    });
});

app.get('/api/doctors', authenticate, (req, res) => {
    db.all(`SELECT * FROM doctors`, (err, rows) => res.json(rows));
});

app.post('/api/doctors/:id/attendance', authenticate, (req, res) => {
    const { is_present } = req.body;
    db.run(`UPDATE doctors SET is_present = ? WHERE id = ?`, [is_present, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Doctor marked as ${is_present ? 'Present' : 'Absent'}` });
    });
});

app.post('/api/check-slot', authenticate, (req, res) => {
    const { doctor_id, appointment_time } = req.body;
    db.get(`SELECT is_present FROM doctors WHERE id = ?`, [doctor_id], (err, doc) => {
        if (!doc || doc.is_present === 0) return res.json({ available: false, message: 'AI ALERT: Doctor is currently Absent/Off-Duty.' });
        db.get(`SELECT * FROM appointments WHERE doctor_id = ? AND appointment_time = ? AND status = 'booked'`, 
            [doctor_id, appointment_time], (err, row) => {
                if (row) return res.json({ available: false, message: 'Conflict: Doctor is already booked for this time.' });
                res.json({ available: true, message: 'Doctor Present & Slot Available.' });
        });
    });
});

app.post('/api/appointments', authenticate, (req, res) => {
    const { patient_name, doctor_id, appointment_time } = req.body;
    db.get(`SELECT is_present FROM doctors WHERE id = ?`, [doctor_id], (err, doc) => {
        if (!doc || doc.is_present === 0) return res.status(400).json({ error: 'Doctor is absent' });
        db.get(`SELECT * FROM appointments WHERE doctor_id = ? AND appointment_time = ? AND status = 'booked'`, 
            [doctor_id, appointment_time], (err, row) => {
                if (row) return res.status(400).json({ error: 'Double-booking detected' });
                db.run(`INSERT INTO appointments (patient_name, doctor_id, appointment_time) VALUES (?, ?, ?)`,
                    [patient_name, doctor_id, appointment_time], function(err) {
                        res.json({ message: 'Appointment booked successfully' });
                });
        });
    });
});

app.post('/api/appointments/:id/cancel', authenticate, (req, res) => {
    const id = req.params.id;
    db.get(`SELECT * FROM appointments WHERE id = ?`, [id], (err, appointment) => {
        if (!appointment) return res.status(404).json({ error: 'Not found' });
        const isLate = (new Date(appointment.appointment_time).getTime() - new Date().getTime()) / (1000 * 60 * 60) < 24;
        db.run(`UPDATE appointments SET status = ?, fee = ? WHERE id = ?`, [isLate ? 'cancelled_fee' : 'cancelled_free', isLate ? 50 : 0, id], () => {
            res.json({ message: `Cancelled. ${isLate ? 'Late fee applied.' : 'No fee.'}` });
        });
    });
});

app.get('/api/appointments', authenticate, (req, res) => {
    const { search, doctor_id, sort = 'appointment_time', order = 'ASC', page = 1, limit = 5 } = req.query;
    let query = `SELECT a.id, a.patient_name, a.appointment_time, a.status, a.fee, d.name as doctor_name FROM appointments a JOIN doctors d ON a.doctor_id = d.id WHERE 1=1`;
    const params = [];
    if (search) { query += ` AND a.patient_name LIKE ?`; params.push(`%${search}%`); }
    if (doctor_id) { query += ` AND a.doctor_id = ?`; params.push(doctor_id); }
    query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt((page - 1) * limit));
    db.all(query, params, (err, rows) => res.json(rows));
});

app.listen(3000, () => console.log('Server running on port 3000'));
