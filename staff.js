import { Router } from "express";
import { sql, getPool } from "../lib/db.js";
import { createId } from "../lib/helpers.js";
import { requireAuth, requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/api/staff", requireAuth, async (req, res) => {
    const pool = getPool();
    const { unit } = req.query;
    const userUnits = (req.user.department || "").split(",");

    if (['admin', 'manager'].includes(req.user.role) || userUnits.includes(unit)) {
        try {
            const r = await pool.request().input('b', unit).query("SELECT * FROM TBL_SHIFT_PERSONEL WHERE BIRIM = @b AND AKTIF = 1 ORDER BY SIRALAMA ASC, AD_SOYAD ASC");
            res.json(r.recordset);
        } catch { res.json([]); }
    } else { res.json([]); }
});

router.post("/api/staff", requireAdmin, async (req, res) => {
    const pool = getPool();
    try {
        await pool.request()
            .input('id', createId())
            .input('n', req.body.name)
            .input('c', req.body.color || '#3B82F6')
            .input('b', req.body.unit)
            .input('t', req.body.type || 'staff')
            .query("INSERT INTO TBL_SHIFT_PERSONEL (ID, AD_SOYAD, RENK, BIRIM, PERSONEL_TIPI) VALUES (@id, @n, @c, @b, @t)");
        res.json({ ok: true });
    } catch (e) { console.error(e); res.status(500).json({message:"Hata"}); }
});

router.delete("/api/staff/:id", requireAdmin, async (req, res) => {
    const pool = getPool();
    try { await pool.request().input('id', sql.VarChar, req.params.id).query("UPDATE TBL_SHIFT_PERSONEL SET AKTIF=0 WHERE ID=@id"); res.json({ ok: true }); } catch { res.status(500).json({message:"Hata"}); }
});

/* ------- SIRALAMA KAYDETME (DÜZELTİLDİ) ------- */
router.post("/api/staff-order", requireAuth, async (req, res) => {
    const pool = getPool();
    const { order } = req.body;
    if (!order || !Array.isArray(order)) return res.status(400).json({ message: "Geçersiz veri" });

    try {
        for (let i = 0; i < order.length; i++) {
            // DÜZELTME: ID'nin tipini sql.VarChar olarak belirttik.
            // Bu olmadan SQL Server UUID'yi tanıyamayıp güncellemeyi atlıyordu.
            await pool.request()
                .input('s', sql.Int, i)
                .input('id', sql.VarChar, order[i])
                .query("UPDATE TBL_SHIFT_PERSONEL SET SIRALAMA = @s WHERE ID = @id");
        }
        res.json({ ok: true });
    } catch (e) {
        console.error("Sıralama Hatası:", e);
        res.status(500).json({ message: "Sıralama kaydedilemedi" });
    }
});

router.get("/api/week-data", requireAuth, async (req, res) => {
    const pool = getPool();
    const { unit, weekISO } = req.query;
    const userUnits = (req.user.department || "").split(",");

    if (!['admin', 'manager'].includes(req.user.role) && !userUnits.includes(unit)) return res.status(403).json({message: "Yetkisiz"});

    try {


const shifts = await pool.request()
    .input('b', unit)
    .input('w', weekISO)
    .query(`
        SELECT ID, PERSONEL_ID, GUN, BASLANGIC, BITIS, GOREV, ETIKET
        FROM TBL_SHIFT_VARDIYA
        WHERE BIRIM = @b AND HAFTA_ISO = @w
        ORDER BY GUN, BASLANGIC
    `);


const note = await pool.request().input('b', unit).input('w', weekISO).query("SELECT TOP 1 NOT_ICERIK FROM TBL_SHIFT_NOTLAR WHERE BIRIM = @b AND HAFTA_ISO = @w");
        res.json({ shifts: shifts.recordset, note: note.recordset[0]?.NOT_ICERIK || "" });
    } catch (e) { res.status(500).json({message: "Hata"}); }
});

router.get("/api/live-all", requireAuth, async (req, res) => {
    const pool = getPool();
    // Admin, manager VEYA fitness kullanıcısı erişebilir
    const isFitnessUser = req.user.username === 'fitness';
    if (!['admin', 'manager'].includes(req.user.role) && !isFitnessUser) {
        return res.status(403).json([]);
    }

    const { weekISO, day } = req.query;
    try {
        // FITNESS kullanıcısı için sadece fitness salonlarını getir
        let query = `
            SELECT v.BASLANGIC, v.BITIS, v.GOREV, v.BIRIM, v.ETIKET, p.AD_SOYAD, p.RENK
            FROM TBL_SHIFT_VARDIYA v
            INNER JOIN TBL_SHIFT_PERSONEL p ON v.PERSONEL_ID = p.ID
            WHERE v.HAFTA_ISO = @w AND v.GUN = @d AND p.AKTIF = 1
        `;

        // Fitness kullanıcısı ise sadece fitness salonlarını filtrele
        if (isFitnessUser) {
            query += ` AND v.BIRIM IN ('Technogym Fitness', 'Genel Fitness')`;
        }

        const r = await pool.request()
            .input('w', weekISO)
            .input('d', sql.Int, day)
            .query(query);
        res.json(r.recordset);
    } catch (e) {
        console.error('Live-all hatası:', e);
        res.status(500).json([]);
    }
});

/* --- DÜZELTİLMİŞ SHIFT KAYDETME (LOG HATASI GİDERİLDİ) --- */
router.post("/api/shift", requireAuth, async (req, res) => {
    const pool = getPool();
    const { staffId, unit, weekISO, day, shifts, tag } = req.body;
    if (!staffId || !unit || !weekISO || day === undefined) return res.status(400).json({ message: "Geçersiz veri gönderildi." });

    const userUnits = (req.user.department || "").split(",");
    if (!['admin', 'manager'].includes(req.user.role) && !userUnits.includes(unit)) return res.status(403).json({ message: "Yetkisiz işlem" });



    try {
        let personName = "Personel";
        try {
            const pRes = await pool.request().input('pid', staffId).query("SELECT AD_SOYAD FROM TBL_SHIFT_PERSONEL WHERE ID = @pid");
            if(pRes.recordset.length > 0) personName = pRes.recordset[0].AD_SOYAD;
        } catch (e) { console.log("İsim alınamadı, devam ediliyor."); }

        await pool.request().input('sid', staffId).input('b', unit).input('w', weekISO).input('d', sql.Int, day).query("DELETE FROM TBL_SHIFT_VARDIYA WHERE PERSONEL_ID = @sid AND BIRIM = @b AND HAFTA_ISO = @w AND GUN = @d");

        // İzin/rapor tag'i varsa boş shift ile kaydet (İDARİ HARİÇ - çünkü İdari'de saatler var)
        if (tag && ['YILLIK', 'HAFTALIK', 'RAPOR'].includes(tag)) {
            console.log(`📝 İzin kaydediliyor: ${tag} - Gün ${day} - Personel ${staffId}`);
            const vid = createId();
            await pool.request()
                .input('id', vid).input('pid', staffId).input('b', unit).input('w', weekISO).input('d', sql.Int, day)
                .input('s', '').input('e', '').input('t', 'İZİN').input('et', tag)
                .query("INSERT INTO TBL_SHIFT_VARDIYA (ID, PERSONEL_ID, BIRIM, HAFTA_ISO, GUN, BASLANGIC, BITIS, GOREV, ETIKET, OLUSTURMA_TARIHI) VALUES (@id, @pid, @b, @w, @d, @s, @e, @t, @et, GETDATE())");
        }

        if (shifts && shifts.length > 0) {
            for (const sh of shifts) {
                const vid = createId();
                await pool.request()
                    .input('id', vid).input('pid', staffId).input('b', unit).input('w', weekISO).input('d', sql.Int, day)
                    .input('s', sh.start).input('e', sh.end).input('t', sh.task || unit).input('et', tag || null)
                    .query("INSERT INTO TBL_SHIFT_VARDIYA (ID, PERSONEL_ID, BIRIM, HAFTA_ISO, GUN, BASLANGIC, BITIS, GOREV, ETIKET, OLUSTURMA_TARIHI) VALUES (@id, @pid, @b, @w, @d, @s, @e, @t, @et, GETDATE())");
            }
        }

        try {
            const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
            const detay = `${personName} • ${unit} • ${dayNames[day]} • ${shifts && shifts.length > 0 ? 'Vardiya Girildi' : 'Vardiya Silindi'}`;
            await pool.request().input('k', req.user.username).input('i', 'Vardiya İşlemi').input('d', detay).query("INSERT INTO TBL_SHIFT_LOGS (KULLANICI, ISLEM, DETAY, TARIH) VALUES (@k, @i, @d, GETDATE())");
        } catch (logErr) { console.error("Loglama hatası (Önemsiz):", logErr.message); }

        res.json({ ok: true });
    } catch (e) { console.error("Shift Kayıt Hatası:", e); res.status(500).json({ message: "Vardiya kaydedilirken bir hata oluştu." }); }
});

router.post("/api/note", requireAuth, async (req, res) => {
    const pool = getPool();
    const { unit, weekISO, content } = req.body;
    const note = content || req.body.note;
    if (!unit || !weekISO) return res.status(400).json({ message: "Geçersiz veri" });
    const userUnits = (req.user.department || "").split(",");
    if (!['admin', 'manager'].includes(req.user.role) && !userUnits.includes(unit)) return res.status(403).json({ message: "Yetkisiz" });
    try {
        await pool.request().input('b', unit).input('w', weekISO).query("DELETE FROM TBL_SHIFT_NOTLAR WHERE BIRIM = @b AND HAFTA_ISO = @w");
        if (note && note.trim()) {
            await pool.request().input('id', createId()).input('b', unit).input('w', weekISO).input('n', note).query("INSERT INTO TBL_SHIFT_NOTLAR (ID, BIRIM, HAFTA_ISO, NOT_ICERIK, OLUSTURMA_TARIHI) VALUES (@id, @b, @w, @n, GETDATE())");
        }
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ message: "Hata" }); }
});

/* ------- İZİN TARİH ARALIĞI ------- */
router.get("/api/leave-range", requireAuth, async (req, res) => {
    const pool = getPool();
    const { staffId, weekISO, day, tag } = req.query;
    if (!staffId || !weekISO || day === undefined || !tag) {
        return res.json({ startDate: null, endDate: null });
    }

    try {
        const result = await pool.request()
            .input('staffId', sql.VarChar, staffId)
            .input('tag', sql.VarChar, tag)
            .query(`
                SELECT HAFTA_ISO, GUN, ETIKET
                FROM TBL_SHIFT_VARDIYA
                WHERE PERSONEL_ID = @staffId AND ETIKET = @tag
                ORDER BY HAFTA_ISO, GUN
            `);

        if (result.recordset.length === 0) {
            return res.json({ startDate: null, endDate: null });
        }

        const firstRecord = result.recordset[0];
        const lastRecord = result.recordset[result.recordset.length - 1];

        const firstMonday = new Date(firstRecord.HAFTA_ISO);
        const lastMonday = new Date(lastRecord.HAFTA_ISO);

        const startDate = new Date(firstMonday);
        startDate.setDate(startDate.getDate() + firstRecord.GUN);

        const endDate = new Date(lastMonday);
        endDate.setDate(endDate.getDate() + lastRecord.GUN);

        res.json({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
    } catch (e) {
        console.error('Leave range error:', e);
        res.json({ startDate: null, endDate: null });
    }
});

export default router;
