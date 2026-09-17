const mysql = require('mysql2/promise');

/* configuración para conectar a la base de datos */
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'recetas',
});

/* la variable pool la pueda usar de forma global */
module.exports = pool;