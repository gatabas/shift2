// lib/db.js — MSSQL veritabanı bağlantısı ve pool yönetimi
import sql from "mssql";

let pool;

async function connectDB() {
    const dbConfig = {
        user: process.env.DB_USER, password: process.env.DB_PASS, server: process.env.DB_SERVER, database: process.env.DB_NAME,
        options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true },
        pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
    };
    try { pool = await sql.connect(dbConfig); console.log("✅ SQL Bağlandı"); } catch (err) { console.error("❌ SQL Hatası:", err.message); }
}

function getPool() { return pool; }

export { sql, connectDB, getPool };
