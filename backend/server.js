const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./config');

const server = express();
const SERVER_PORT = 5000;
const SECRET_KEY = 'your-secret-key-change-this';

server.use(cors());
server.use(express.json());

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Access denied' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        req.user = jwt.verify(token, SECRET_KEY);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

server.post('/api/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        const [found] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (found.length) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const encryptedPassword = await bcrypt.hash(password, 10);

        const [created] = await pool.query(
            'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
            [email, encryptedPassword, name, role || 'user']
        );

        const token = jwt.sign(
            {
                id: created.insertId,
                email,
                name,
                role: role || 'user'
            },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: created.insertId,
                email,
                name,
                role: role || 'user'
            }
        });
    } catch {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

server.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (!rows.length) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const account = rows[0];
        const passwordOk = await bcrypt.compare(password, account.password);

        if (!passwordOk) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: account.id,
                email: account.email,
                name: account.name,
                role: account.role
            },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: account.id,
                email: account.email,
                name: account.name,
                role: account.role
            }
        });
    } catch {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

server.get('/api/me', authenticate, async (req, res) => {
    try {
        const [data] = await pool.query(
            'SELECT id, email, name, role FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!data.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(data[0]);
    } catch {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

server.get('/api/plans', async (req, res) => {
    try {
        const [plans] = await pool.query(`
            SELECT fp.id, fp.title, fp.description, fp.price, fp.duration_days,
                   fp.trainer_id, u.name AS trainer_name
            FROM fitness_plans fp
            INNER JOIN users u ON u.id = fp.trainer_id
            ORDER BY fp.created_at DESC
        `);

        const response = plans.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description ? p.description.slice(0, 100) + '...' : '',
            price: p.price,
            duration_days: p.duration_days,
            trainer_id: p.trainer_id,
            trainer_name: p.trainer_name
        }));

        res.json(response);
    } catch {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

server.get('/api/plans/:id', authenticate, async (req, res) => {
    try {
        const planId = req.params.id;

        const [plans] = await pool.query(`
            SELECT fp.*, u.name AS trainer_name
            FROM fitness_plans fp
            JOIN users u ON u.id = fp.trainer_id
            WHERE fp.id = ?
        `, [planId]);

        if (!plans.length) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        const plan = plans[0];

        const [subscribed] = await pool.query(
            'SELECT id FROM subscriptions WHERE user_id = ? AND plan_id = ?',
            [req.user.id, planId]
        );

        const accessGranted =
            subscribed.length > 0 || plan.trainer_id === req.user.id;

        if (!accessGranted) {
            return res.json({
                id: plan.id,
                title: plan.title,
                price: plan.price,
                duration_days: plan.duration_days,
                trainer_name: plan.trainer_name,
                has_access: false
            });
        }

        res.json({ ...plan, has_access: true });
    } catch {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

server.post('/api/plans', authenticate, async (req, res) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ error: 'Permission denied' });
    }

    try {
        const { title, description, price, duration_days } = req.body;

        const [created] = await pool.query(
            `INSERT INTO fitness_plans 
             (title, description, price, duration_days, trainer_id)
             VALUES (?, ?, ?, ?, ?)`,
            [title, description, price, duration_days, req.user.id]
        );

        res.json({ plan_id: created.insertId });
    } catch {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

server.listen(SERVER_PORT, () => {
    console.log(`Server running on http://localhost:${SERVER_PORT}`);
});
