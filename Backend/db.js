const { Pool } = require("pg");
require('dotenv').config({ path: __dirname + '/../.env' }); // Load environment variables

const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "root",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "budget_tracking",
});

pool.connect()
    .then(() => console.log("Connected to the database ✅"))
    .catch((err) => console.error("Database connection error ❌:", err.message));

module.exports = pool;
