import { spawn } from "child_process";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import sql from "mssql";
import bcrypt from "bcrypt";
import cron from "node-cron";
import compression from "compression";
import helmet from "helmet";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ========== SECURITY & PERFORMANCE MIDDLEWARE ========== */
app.use(helmet({
    contentSecurityPolicy: false, // Tailwind CDN için
    crossOriginEmbedderPolicy: false
}));
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    },
    level: 6 // 0-9 arası, 6 optimal
}));

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(cors({ 
    origin: ["http://localhost:3000", "https://spodeme.pau.edu.tr"], 
    credentials: true 
}));

// Static files - cache control
app.use(express.static(path.join(__dirname, "dist"), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.match(/\.(js|css)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (filePath.match(/\.(jpg|jpeg|png|gif|ico|svg)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

/* ========== CACHE SYSTEM ========== */
const CACHE = new Map();
const CACHE_STATS = { hits: 0, misses: 0 };

function createCacheKey(req) {
    const { unit, weekISO } = req.query;
    const userId = req.user?.id || 'anonymous';
    return `${req.path}:${userId}:${unit || ''}:${weekISO || ''}`;
}

function cacheMiddleware(ttl = 60000) {
    return (req, res, next) => {
        const key = createCacheKey(req);
        const cached = CACHE.get(key);
        
        if (cached && Date.now() - cached.timestamp < ttl) {
            CACHE_STATS.hits++;
            res.setHeader('X-Cache', 'HIT');
            return res.json(cached.data);
        }
        
        CACHE_STATS.misses++;
        res.setHeader('X-Cache', 'MISS');
        
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            CACHE.set(key, { data, timestamp: Date.now() });
            // Maksimum 500 cache entry tut
            if (CACHE.size > 500) {
                const firstKey = CACHE.keys().next().value;
                CACHE.delete(firstKey);
            }
            return originalJson(data);
        };
        next();
    };
}

function invalidateCache(pattern) {
    let count = 0;
    for (const key of CACHE.keys()) {
        if (key.includes(pattern)) {
            CACHE.delete(key);
            count++;
        }
    }
    console.log(`🗑️  Cache invalidated: ${count} entries for pattern "${pattern}"`);
}

// Her 5 dakikada bir eski cache'leri temizle
setInterval(() => {
    const now = Date.now();
    let cleared = 0;
    for (const [key, value] of CACHE.entries()) {
        if (now - value.timestamp > 300000) { // 5 dakikadan eski
            CACHE.delete(key);
            cleared++;
        }
    }
    if (cleared > 0) console.log(`🧹 Cache cleanup: ${cleared} expired entries removed`);
}, 300000);

/* ========== MAIL ========== */
let transporter;
try {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "eposta.pau.edu.tr", 
        port: 587, 
        secure: false,
        auth: { 
            user: process.env.SMTP_USER, 
            pass: process.env.SMTP_PASS 
        },
        tls: { 
            ciphers: "DEFAULT@SECLEVEL=0", 
            rejectUnauthorized: false 
        }
    });
} catch (err) { 
    console.error("📧 Mail configuration error:", err.message); 
}

/* ========== DATABASE ========== */
const dbConfig = {
    user: process.env.DB_USER, 
    password: process.env.DB_PASS, 
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME,
    options: { 
        encrypt: false, 
        trustServerCertificate: true, 
        enableArithAbort: true 
    },
    pool: { 
        max: 20,        // 10 kullanıcı için yeterli
        min: 2,         // Minimum bağlantı
        idleTimeoutMillis: 30000 
    }
};

let pool;
async function connectDB() { 
    try { 
        pool = await sql.connect(dbConfig); 
        console.log("✅ SQL Server Connected"); 
        
        // Connection pool events
        pool.on('error', err => {
            console.error('💥 SQL Pool Error:', err);
        });
        
    } catch (err) { 
        console.error("❌ SQL Connection Error:", err.message); 
        setTimeout(connectDB, 5000); // 5 saniye sonra tekrar dene
    } 
}
connectDB();

/* ========== HELPERS ========== */
const sha256 = s => crypto.createHash("sha256").update(String(s)).digest("hex");
const createSid = () => crypto.randomBytes(18).toString("hex");
const createId = () => crypto.randomUUID();

const SESSIONS = new Map();

// Session cleanup - her saat
setInterval(() => {
    const now = Date.now();
    const timeout = 24 * 60 * 60 * 1000; // 24 saat
    let cleared = 0;
    
    for (const [sid, session] of SESSIONS.entries()) {
        if (now - session.createdAt > timeout) {
            SESSIONS.delete(sid);
            cleared++;
        }
    }
    
    if (cleared > 0) {
        console.log(`🧹 Session cleanup: ${cleared} expired sessions removed`);
    }
}, 3600000);

const sessionUser = req => { 
    const sid = req.cookies?.sid; 
    return sid && SESSIONS.get(sid); 
};

const requireAuth = (req, res, next) => { 
    const u = sessionUser(req); 
    if (!u) return res.status(401).json({ message: "Oturum yok" }); 
    req.user = u; 
    next(); 
};

const requireAdmin = (req, res, next) => { 
    const me = sessionUser(req); 
    if (!me || me.role !== "admin") {
        return res.status(403).json({ message: "Yetkisiz" }); 
    }
    next(); 
};

/* ========== AUTH API ========== */
app.post("/api/auth/login", async (req, res) => {
    if (!pool) return res.status(500).json({ message: "Veritabanı bağlantısı yok" });
    
    const { username, password } = req.body || {};
    
    if (!username || !password) {
        return res.status(400).json({ message: "Kullanıcı adı ve şifre gerekli" });
    }
    
    try {
        const r = await pool.request()
            .input('u', sql.NVarChar, username)
            .query('SELECT * FROM TBL_SHIFT_KULLANICILAR WHERE KULLANICI_ADI = @u');
        
        const user = r.recordset[0];
        if (!user) {
            return res.status(401).json({ message: "Hatalı kullanıcı adı veya şifre" });
        }

        let match = false, migrationNeeded = false;
        
        if (user.SIFRE_HASH.startsWith('$2b$') || user.SIFRE_HASH.startsWith('$2a$')) {
            match = await bcrypt.compare(password, user.SIFRE_HASH);
        } else {
            if (user.SIFRE_HASH === sha256(password)) { 
                match = true; 
                migrationNeeded = true; 
            }
        }

        if (!match) {
            return res.status(401).json({ message: "Hatalı kullanıcı adı veya şifre" });
        }
        
        if (migrationNeeded) {
            const newHash = await bcrypt.hash(password, 10);
            await pool.request()
                .input('h', sql.NVarChar, newHash)
                .input('id', sql.NVarChar, user.ID)
                .query('UPDATE TBL_SHIFT_KULLANICILAR SET SIFRE_HASH = @h WHERE ID = @id');
        }

        const sData = { 
            id: user.ID, 
            username: user.KULLANICI_ADI, 
            role: user.ROL, 
            department: user.BIRIM, 
            first_name: user.AD, 
            last_name: user.SOYAD,
            createdAt: Date.now()
        };
        
        const sid = createSid(); 
        SESSIONS.set(sid, sData);
        
        res.cookie("sid", sid, { 
            httpOnly: true, 
            sameSite: "Lax", 
            path: "/",
            maxAge: 24 * 60 * 60 * 1000 // 24 saat
        }); 
        
        console.log(`✅ Login: ${user.KULLANICI_ADI} (${user.ROL})`);
        res.json(sData);
        
    } catch (e) { 
        console.error('Login error:', e);
        res.status(500).json({ message: "Sunucu hatası" }); 
    }
});

app.get("/api/auth/me", (req, res) => { 
    const u = sessionUser(req); 
    u ? res.json(u) : res.status(401).json({ message: "Oturum bulunamadı" }); 
});

app.post("/api/auth/logout", (req, res) => { 
    const sid = req.cookies?.sid; 
    if (sid) {
        const user = SESSIONS.get(sid);
        SESSIONS.delete(sid); 
        if (user) console.log(`👋 Logout: ${user.username}`);
    }
    res.clearCookie("sid", { path: "/" }); 
    res.json({ ok: true }); 
});

/* ========== DATA API (CACHED) ========== */

// Units - 5 dakika cache (birimler nadiren değişir)
app.get("/api/units", requireAuth, cacheMiddleware(300000), async (req, res) => {
    try {
        const r = await pool.request()
            .query("SELECT ID, BIRIM_ADI as name, SIRALAMA as orderIndex FROM TBL_SHIFT_BIRIMLER ORDER BY SIRALAMA ASC, BIRIM_ADI ASC");
        res.json(r.recordset.map(u => ({ id: u.ID, name: u.name })));
    } catch (e) {
        console.error('Units API error:', e);
        res.status(500).json([]);
    }
});

// Staff - 2 dakika cache
app.get("/api/staff", requireAuth, cacheMiddleware(120000), async (req, res) => {
    const { unit } = req.query;
    const userUnits = (req.user.department || "").split(","); 
    
    if (['admin', 'manager'].includes(req.user.role) || userUnits.includes(unit)) {
        try { 
            const r = await pool.request()
                .input('b', sql.NVarChar, unit)
                .query(`
                    SELECT ID, AD_SOYAD, RENK, PERSONEL_TIPI, SIRALAMA 
                    FROM TBL_SHIFT_PERSONEL 
                    WHERE BIRIM = @b AND AKTIF = 1 
                    ORDER BY SIRALAMA ASC, AD_SOYAD ASC
                `); 
            res.json(r.recordset); 
        } catch (e) { 
            console.error('Staff API error:', e);
            res.json([]); 
        }
    } else { 
        res.json([]); 
    }
});

// Week Data - 30 saniye cache (sık değişebilir)
app.get("/api/week-data", requireAuth, cacheMiddleware(30000), async (req, res) => {
    const { unit, weekISO } = req.query;
    
    try {
        const [shiftsResult, noteResult] = await Promise.all([
            pool.request()
                .input('b', sql.NVarChar, unit)
                .input('w', sql.NVarChar, weekISO)
                .query(`
                    SELECT ID, PERSONEL_ID, GUN, BASLANGIC, BITIS, ETIKET, GOREV
                    FROM TBL_SHIFT_VARDIYA 
                    WHERE BIRIM = @b AND HAFTA_ISO = @w
                    ORDER BY GUN, BASLANGIC
                `),
            pool.request()
                .input('b', sql.NVarChar, unit)
                .input('w', sql.NVarChar, weekISO)
                .query("SELECT NOT_ICERIK FROM TBL_SHIFT_NOTLAR WHERE BIRIM = @b AND HAFTA_ISO = @w")
        ]);
        
        res.json({ 
            shifts: shiftsResult.recordset, 
            note: noteResult.recordset[0]?.NOT_ICERIK || "" 
        });
    } catch (e) {
        console.error('Week-data API error:', e);
        res.status(500).json({ shifts: [], note: "" });
    }
});

// Templates - 5 dakika cache
app.get("/api/templates", requireAuth, cacheMiddleware(300000), async (req, res) => {
    const { unit } = req.query;
    try {
        const r = await pool.request()
            .input('b', sql.NVarChar, unit)
            .query("SELECT * FROM TBL_SHIFT_SABLONLAR WHERE BIRIM = @b ORDER BY SIRALAMA ASC");
        res.json(r.recordset);
    } catch (e) {
        console.error('Templates API error:', e);
        res.json([]);
    }
});

// Tasks - 5 dakika cache
app.get("/api/tasks", requireAuth, cacheMiddleware(300000), async (req, res) => {
    const { unit } = req.query;
    try {
        const r = await pool.request()
            .input('b', sql.Int, parseInt(unit))
            .query(`
                SELECT ID, BIRIM_ID, GOREV_ADI, SIRALAMA, AKTIF 
                FROM TBL_SHIFT_GOREVLER 
                WHERE BIRIM_ID = @b AND AKTIF = 1 
                ORDER BY SIRALAMA ASC, GOREV_ADI ASC
            `);
        res.json(r.recordset);
    } catch (e) {
        console.error('Tasks API error:', e);
        res.json([]);
    }
});

/* ========== WRITE OPERATIONS (INVALIDATE CACHE) ========== */

app.post("/api/shift", requireAuth, async (req, res) => {
    // ... mevcut kod ...
    // İşlem sonunda:
    invalidateCache(`/api/week-data:${unit}:${weekISO}`);
    // ... response
});

app.delete("/api/shift/:id", requireAuth, async (req, res) => {
    // ... mevcut kod ...
    invalidateCache('/api/week-data');
    // ... response
});

app.post("/api/note", requireAuth, async (req, res) => {
    // ... mevcut kod ...
    invalidateCache('/api/week-data');
    // ... response
});

/* ========== HEALTH CHECK & STATS ========== */
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        database: pool ? "connected" : "disconnected",
        cache: {
            size: CACHE.size,
            hits: CACHE_STATS.hits,
            misses: CACHE_STATS.misses,
            hitRate: CACHE_STATS.hits / (CACHE_STATS.hits + CACHE_STATS.misses) || 0
        },
        sessions: SESSIONS.size,
        memory: process.memoryUsage()
    });
});

/* ========== START SERVER ========== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
🚀 PAÜ Shift System - Production Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server: http://localhost:${PORT}
💾 Database: ${process.env.DB_SERVER}/${process.env.DB_NAME}
🔐 Security: Helmet + Compression enabled
⚡ Cache: Active (auto-cleanup enabled)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📴 SIGTERM received, shutting down gracefully...');
    await pool.close();
    process.exit(0);
});

