
require('dotenv').config();

const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {

    // Hosted PostgreSQL database
    pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

} else {

    // Local PostgreSQL database
    pool = new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

}

module.exports = pool;
