import { Router } from "express";
import bcrypt from "bcrypt";
import { sql, getPool } from "../lib/db.js";
import { createId } from "../lib/helpers.js";
import { SESSIONS, sessionUser, requireAuth, requireAdmin } from "../lib/auth.js";

const router = Router();

/* ------- YÖNETİCİ API ------- */
router.get("/api/admin/users", requireAdmin, async (req, res) => {
    const pool = getPool();
    try { const r = await pool.request().query("SELECT ID as id, KULLANICI_ADI as username, AD as first_name, SOYAD as last_name, ROL as role, BIRIM as department FROM TBL_SHIFT_KULLANICILAR ORDER BY AD ASC"); res.json(r.recordset); } catch { res.json([]); }
});

router.post("/api/admin/users", requireAdmin, async (req, res) => {
    const pool = getPool();
    // Hem camelCase hem snake_case kabul et (geriye uyumluluk)
    const {
        username,
        password,
        firstName,
        lastName,
        first_name,
        last_name,
        role,
        units,
        department
    } = req.body;

    if (!username || !password) return res.status(400).json({ message: "Zorunlu alanlar eksik" });

    try {
        const h = await bcrypt.hash(password, 10);
        // Frontend'den department veya units gelebilir
        const dept = department || (Array.isArray(units) ? units.join(",") : "");
        // Ad/Soyad için hem camelCase hem snake_case desteği
        const ad = first_name || firstName || '';
        const soyad = last_name || lastName || '';

        await pool.request()
            .input('id', createId())
            .input('u', username)
            .input('h', h)
            .input('f', ad)
            .input('l', soyad)
            .input('r', role)
            .input('d', dept)
            .query("INSERT INTO TBL_SHIFT_KULLANICILAR (ID, KULLANICI_ADI, SIFRE_HASH, AD, SOYAD, ROL, BIRIM) VALUES (@id, @u, @h, @f, @l, @r, @d)");

        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    const pool = getPool();
    try {
        const { username, password, role, department, first_name, last_name } = req.body;

        if (password && password.length > 0) {
            const hash = await bcrypt.hash(password, 10);
            await pool.request()
                .input('id', sql.VarChar, req.params.id)
                .input('u', sql.NVarChar, username)
                .input('h', sql.NVarChar, hash)
                .input('f', sql.NVarChar, first_name)
                .input('l', sql.NVarChar, last_name)
                .input('r', sql.VarChar, role)
                .input('d', sql.NVarChar, department)
                .query("UPDATE TBL_SHIFT_KULLANICILAR SET KULLANICI_ADI=@u, SIFRE_HASH=@h, AD=@f, SOYAD=@l, ROL=@r, BIRIM=@d WHERE ID=@id");
        } else {
            await pool.request()
                .input('id', sql.VarChar, req.params.id)
                .input('u', sql.NVarChar, username)
                .input('f', sql.NVarChar, first_name)
                .input('l', sql.NVarChar, last_name)
                .input('r', sql.VarChar, role)
                .input('d', sql.NVarChar, department)
                .query("UPDATE TBL_SHIFT_KULLANICILAR SET KULLANICI_ADI=@u, AD=@f, SOYAD=@l, ROL=@r, BIRIM=@d WHERE ID=@id");
        }
        res.json({ message: 'Güncellendi' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Güncelleme hatası' }); }
});

router.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const pool = getPool();
    try {
        // Kendini silmeyi engelle
        const me = sessionUser(req);
        if (me && me.id === req.params.id) {
            return res.status(400).json({ message: "Kendi hesabınızı silemezsiniz" });
        }
        // Soft delete: AKTIF alanı yoksa hard delete'e fallback
        try {
            await pool.request().input('id', sql.VarChar, req.params.id).query("UPDATE TBL_SHIFT_KULLANICILAR SET AKTIF = 0 WHERE ID = @id");
        } catch {
            await pool.request().input('id', sql.VarChar, req.params.id).query("DELETE FROM TBL_SHIFT_KULLANICILAR WHERE ID = @id");
        }
        // Aktif oturumlarını da temizle
        for (const [sid, data] of SESSIONS) {
            if (data.id === req.params.id) SESSIONS.delete(sid);
        }
        res.json({ ok: true });
    } catch (e) { console.error(e); res.status(500).json({ message: "Silme hatası" }); }
});

router.get("/api/units", requireAuth, async (req, res) => {
    const pool = getPool();
    try { const r = await pool.request().query("SELECT ID as dbId, BIRIM_ADI as id, BIRIM_ADI as name, SIRALAMA as siralama FROM TBL_SHIFT_BIRIMLER ORDER BY SIRALAMA ASC"); res.json(r.recordset); } catch { res.json([]); }
});

router.delete("/api/units/:id", requireAdmin, async (req, res) => {
    const pool = getPool();
    try {
        // Önce birim adını al
        const unitResult = await pool.request().input('id', sql.Int, req.params.id).query("SELECT BIRIM_ADI FROM TBL_SHIFT_BIRIMLER WHERE ID = @id");
        if (unitResult.recordset.length === 0) return res.status(404).json({ message: "Birim bulunamadı" });

        const unitName = unitResult.recordset[0].BIRIM_ADI;

        // Bu birimde aktif personel var mı kontrol et
        const staffCheck = await pool.request().input('b', unitName).query("SELECT COUNT(*) as CNT FROM TBL_SHIFT_PERSONEL WHERE BIRIM = @b AND AKTIF = 1");
        if (staffCheck.recordset[0].CNT > 0) {
            return res.status(400).json({ message: `Bu birimde ${staffCheck.recordset[0].CNT} aktif personel var. Önce personeli taşıyın veya pasife alın.` });
        }

        await pool.request().input('id', sql.Int, req.params.id).query("DELETE FROM TBL_SHIFT_BIRIMLER WHERE ID = @id");
        res.json({ ok: true });
    } catch (e) { console.error(e); res.status(500).json({ message: "Birim silinemedi" }); }
});

router.post("/api/units-order", requireAdmin, async (req, res) => {
    const pool = getPool();
    const { order } = req.body;
    if (!order || !Array.isArray(order)) return res.status(400).json({ message: "Geçersiz veri" });
    try {
        for (let i = 0; i < order.length; i++) { await pool.request().input('s', sql.Int, i).input('id', order[i]).query("UPDATE TBL_SHIFT_BIRIMLER SET SIRALAMA = @s WHERE ID = @id"); }
        res.json({ ok: true });
    } catch { res.status(500).json({ message: "Sıralama kaydedilemedi" }); }
});

router.get("/api/logs", requireAdmin, async (req, res) => {
    const pool = getPool();
    try {
        // Pagination parametreleri
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 500;
        const offset = (page - 1) * limit;

        // Toplam kayıt sayısı
        const countResult = await pool.request().query("SELECT COUNT(*) as TOTAL FROM TBL_SHIFT_LOGS");
        const total = countResult.recordset[0].TOTAL;

        // Sayfalı veri çek (sadece ana tablodan)
        const r = await pool.request()
            .input('limit', limit)
            .input('offset', offset)
            .query(`
                SELECT * FROM TBL_SHIFT_LOGS
                ORDER BY TARIH DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

        res.json({
            logs: r.recordset,
            total: total,
            page: page,
            limit: limit,
            pages: Math.ceil(total / limit)
        });
    } catch (e) {
        console.error('Log Hatası:', e);
        res.json({ logs: [], total: 0, page: 1, limit: 500, pages: 0 });
    }
});

export default router;
