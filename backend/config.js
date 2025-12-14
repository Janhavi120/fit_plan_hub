const mysql = require('mysql2');

// Database connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root', 
    database: 'fitplanhub',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = { pool };