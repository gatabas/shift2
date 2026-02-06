import { Router } from "express";
import bcrypt from "bcrypt";
import { sha256, createSid } from "../lib/helpers.js";
import { getPool } from "../lib/db.js";
import { SESSIONS, sessionUser } from "../lib/auth.js";

const router = Router();

router.post("/api/auth/login", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ message: "DB yok" });
    const { username, password } = req.body || {};
    try {
        const r = await pool.request().input('u', username).query('SELECT * FROM TBL_SHIFT_KULLANICILAR WHERE KULLANICI_ADI = @u AND (AKTIF IS NULL OR AKTIF = 1)');
        const user = r.recordset[0];
        if (!user) return res.status(401).json({ message: "Hatalı giriş" });

        let match = false, migrationNeeded = false;
        if (user.SIFRE_HASH.startsWith('$2b$') || user.SIFRE_HASH.startsWith('$2a$')) {
            match = await bcrypt.compare(password, user.SIFRE_HASH);
        } else {
            if (user.SIFRE_HASH === sha256(password)) { match = true; migrationNeeded = true; }
        }

        if (!match) return res.status(401).json({ message: "Hatalı giriş" });
        if (migrationNeeded) {
            const newHash = await bcrypt.hash(password, 10);
            await pool.request().input('h', newHash).input('id', user.ID).query('UPDATE TBL_SHIFT_KULLANICILAR SET SIFRE_HASH = @h WHERE ID = @id');
        }

        const sData = { id: user.ID, username: user.KULLANICI_ADI, role: user.ROL, department: user.BIRIM, first_name: user.AD, last_name: user.SOYAD };
        const sid = createSid(); SESSIONS.set(sid, sData);
        res.cookie("sid", sid, { httpOnly: true, sameSite: "Lax", path: "/" }); res.json(sData);
    } catch (e) { res.status(500).json({ message: "Hata" }); }
});

router.get("/api/auth/me", (req, res) => { const u = sessionUser(req); u ? res.json(u) : res.status(401).json({ message: "Yok" }); });
router.post("/api/auth/logout", (req, res) => { const sid = req.cookies?.sid; if (sid) SESSIONS.delete(sid); res.clearCookie("sid", { path: "/" }); res.json({ ok: true }); });

export default router;
