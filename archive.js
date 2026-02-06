import { Router } from "express";
import { getPool } from "../lib/db.js";
import { createId } from "../lib/helpers.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

/* ------- ARŞİV API ------- */
router.get("/api/archive", requireAuth, async (req, res) => {
    const pool = getPool();
    const { unit } = req.query;
    if (!unit) return res.status(400).json({ message: "Birim gerekli" });

    const userUnits = (req.user.department || "").split(",");
    if (!['admin', 'manager'].includes(req.user.role) && !userUnits.includes(unit)) {
        return res.status(403).json([]);
    }

    try {
        const r = await pool.request()
            .input('b', unit)
            .query(`
                SELECT TOP 50
                    ID,
                    BIRIM,
                    HAFTA_ISO,
                    BASLIK,
                    OLUSTURMA_TARIHI
                FROM TBL_SHIFT_ARSIV
                WHERE BIRIM = @b
                ORDER BY OLUSTURMA_TARIHI DESC
            `);
        res.json(r.recordset);
    } catch (e) {
        console.error('Arşiv Hatası:', e);
        res.json([]);
    }
});

router.get("/api/archive/:id", requireAuth, async (req, res) => {
    const pool = getPool();
    try {
        const r = await pool.request().input('id', req.params.id).query("SELECT * FROM TBL_SHIFT_ARSIV WHERE ID = @id");
        const arch = r.recordset[0];
        if (!arch) return res.status(404).json({ message: "Bulunamadı" });
        const userUnits = (req.user.department || "").split(",");
        if (!['admin', 'manager'].includes(req.user.role) && !userUnits.includes(arch.BIRIM)) return res.status(403).json({ message: "Yetkisiz" });
        res.json({ ...arch, content: arch.DATA_JSON });
    } catch (e) { res.status(500).json({ message: "Hata" }); }
});

router.post("/api/archive", requireAuth, async (req, res) => {
    const pool = getPool();
    const { unit, weekISO, title, label } = req.body;
    const baslik = title || label;
    if (!unit || !weekISO || !baslik) return res.status(400).json({ message: "Eksik veri" });
    const userUnits = (req.user.department || "").split(",");
    if (!['admin', 'manager'].includes(req.user.role) && !userUnits.includes(unit)) return res.status(403).json({ message: "Yetkisiz" });
    try {
        const shifts = await pool.request().input('b', unit).input('w', weekISO).query("SELECT * FROM TBL_SHIFT_VARDIYA WHERE BIRIM = @b AND HAFTA_ISO = @w");
        const note = await pool.request().input('b', unit).input('w', weekISO).query("SELECT TOP 1 NOT_ICERIK FROM TBL_SHIFT_NOTLAR WHERE BIRIM = @b AND HAFTA_ISO = @w");
        const data = JSON.stringify({ shifts: shifts.recordset, note: note.recordset[0]?.NOT_ICERIK || "" });
        await pool.request().input('id', createId()).input('b', unit).input('w', weekISO).input('t', baslik).input('d', data).query("INSERT INTO TBL_SHIFT_ARSIV (ID, BIRIM, HAFTA_ISO, BASLIK, DATA_JSON, OLUSTURMA_TARIHI) VALUES (@id, @b, @w, @t, @d, GETDATE())");
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ message: "Hata" }); }
});

router.delete("/api/archive/:id", requireAuth, async (req, res) => {
    const pool = getPool();
    try {
        const r = await pool.request().input('id', req.params.id).query("SELECT BIRIM FROM TBL_SHIFT_ARSIV WHERE ID = @id");
        const arch = r.recordset[0];
        if (!arch) return res.status(404).json({ message: "Bulunamadı" });
        const userUnits = (req.user.department || "").split(",");
        if (!['admin', 'manager'].includes(req.user.role) && !userUnits.includes(arch.BIRIM)) return res.status(403).json({ message: "Yetkisiz" });
        await pool.request().input('id', req.params.id).query("DELETE FROM TBL_SHIFT_ARSIV WHERE ID = @id");
        res.json({ ok: true });
    } catch { res.status(500).json({ message: "Hata" }); }
});

export default router;
