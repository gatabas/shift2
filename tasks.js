import { Router } from "express";
import { sql, getPool } from "../lib/db.js";
import { requireAuth, requireAdmin } from "../lib/auth.js";

const router = Router();

/* --- GÖREV YÖNETİMİ --- */
// Bir birimin görevlerini getir
router.get("/api/tasks", requireAuth, async (req, res) => {
    const pool = getPool();
    const { unit } = req.query;
    if (!unit) return res.status(400).json({ message: "Birim gerekli" });
    try {
        // unit ID veya birim adı olabilir
        let unitId;
        if (isNaN(unit)) {
            const unitResult = await pool.request()
                .input('unitName', sql.NVarChar, unit)
                .query("SELECT ID FROM TBL_SHIFT_BIRIMLER WHERE BIRIM_ADI = @unitName");
            if (unitResult.recordset.length === 0) {
                return res.status(404).json({ message: "Birim bulunamadı" });
            }
            unitId = unitResult.recordset[0].ID;
        } else {
            unitId = parseInt(unit);
        }

        const r = await pool.request()
            .input('unit', sql.Int, unitId)
            .query("SELECT ID, GOREV_ADI as name, SIRALAMA as [order] FROM TBL_SHIFT_GOREVLER WHERE BIRIM_ID = @unit AND AKTIF = 1 ORDER BY SIRALAMA, GOREV_ADI");
        res.json(r.recordset);
    } catch (e) {
        console.error('Görev yükleme hatası:', e);
        res.status(500).json({ message: "Görevler yüklenemedi" });
    }
});

// Yeni görev ekle (Admin)
router.post("/api/tasks", requireAdmin, async (req, res) => {
    const pool = getPool();
    const { unitId, name, order } = req.body;
    if (!unitId || !name) return res.status(400).json({ message: "Birim ve görev adı gerekli" });
    try {
        await pool.request()
            .input('unit', sql.Int, unitId)
            .input('name', sql.NVarChar(100), name)
            .input('order', sql.Int, order || 999)
            .query("INSERT INTO TBL_SHIFT_GOREVLER (BIRIM_ID, GOREV_ADI, SIRALAMA) VALUES (@unit, @name, @order)");
        res.json({ ok: true });
    } catch (e) {
        console.error('Görev ekleme hatası:', e);
        res.status(500).json({ message: "Görev eklenemedi" });
    }
});

// Görev güncelle (Admin)
router.put("/api/tasks/:id", requireAdmin, async (req, res) => {
    const pool = getPool();
    const { name, order } = req.body;
    try {
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('name', sql.NVarChar(100), name)
            .input('order', sql.Int, order)
            .query("UPDATE TBL_SHIFT_GOREVLER SET GOREV_ADI = @name, SIRALAMA = @order WHERE ID = @id");
        res.json({ ok: true });
    } catch (e) {
        console.error('Görev güncelleme hatası:', e);
        res.status(500).json({ message: "Görev güncellenemedi" });
    }
});

// Görev sil (Admin)
router.delete("/api/tasks/:id", requireAdmin, async (req, res) => {
    const pool = getPool();
    try {
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query("UPDATE TBL_SHIFT_GOREVLER SET AKTIF = 0 WHERE ID = @id");
        res.json({ ok: true });
    } catch (e) {
        console.error('Görev silme hatası:', e);
        res.status(500).json({ message: "Görev silinemedi" });
    }
});

/* ------- ŞABLONLAR (TEMPLATES) API - DÜZELTİLDİ (ID OTOMATİK) ------- */
router.get("/api/templates", requireAuth, async (req, res) => {
    const pool = getPool();
    const { unit } = req.query;
    try {
        const r = await pool.request()
            .input('b', unit)
            .query("SELECT * FROM TBL_SHIFT_SABLONLAR WHERE BIRIM = @b ORDER BY SIRA ASC, BASLIK ASC");
        res.json(r.recordset);
    } catch (e) {
        console.error("Şablon Listeleme Hatası:", e.message);
        res.json([]);
    }
});

/* ------- ŞABLON EKLEME (DÜZELTİLDİ: ID OTOMATİK) ------- */
router.post("/api/templates", requireAuth, async (req, res) => {
    const pool = getPool();
    const { unit, label, start, end, task } = req.body;

    // Basit validasyon
    if (!unit || !label || !start || !end) {
        return res.status(400).json({ message: "Eksik veri" });
    }

    try {
        // En büyük SIRA değerini bul
        const maxSiraResult = await pool.request()
            .input('b', sql.NVarChar, unit)
            .query("SELECT ISNULL(MAX(SIRA), 0) + 1 AS NextSira FROM TBL_SHIFT_SABLONLAR WHERE BIRIM = @b");
        const nextSira = maxSiraResult.recordset[0].NextSira;

        await pool.request()
            .input('b', sql.NVarChar, unit)
            .input('n', sql.NVarChar, label)
            .input('s', sql.VarChar, start)
            .input('e', sql.VarChar, end)
            .input('t', sql.NVarChar, task || '')
            .input('sira', sql.Int, nextSira)
            .query("INSERT INTO TBL_SHIFT_SABLONLAR (BIRIM, BASLIK, BASLANGIC, BITIS, GOREV, SIRA) VALUES (@b, @n, @s, @e, @t, @sira)");

        res.json({ ok: true });
    } catch (e) {
        console.error("Şablon Ekleme Hatası:", e.message);
        res.status(500).json({ message: "Şablon eklenirken bir hata oluştu." });
    }
});

/* ------- ŞABLON GÜNCELLEME ------- */
router.put("/api/templates/:id", requireAuth, async (req, res) => {
    const pool = getPool();
    const { label, start, end, task } = req.body;

    if (!label || !start || !end) {
        return res.status(400).json({ message: "Eksik veri" });
    }

    try {
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('n', sql.NVarChar, label)
            .input('s', sql.VarChar, start)
            .input('e', sql.VarChar, end)
            .input('t', sql.NVarChar, task || '')
            .query("UPDATE TBL_SHIFT_SABLONLAR SET BASLIK = @n, BASLANGIC = @s, BITIS = @e, GOREV = @t WHERE ID = @id");

        res.json({ ok: true });
    } catch (e) {
        console.error("Şablon Güncelleme Hatası:", e.message);
        res.status(500).json({ message: "Güncellenemedi" });
    }
});

router.delete("/api/templates/:id", requireAuth, async (req, res) => {
    const pool = getPool();
    try {
        // DÜZELTME: Silme işleminde ID'nin Sayı (Int) olduğunu belirttik
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query("DELETE FROM TBL_SHIFT_SABLONLAR WHERE ID = @id");

        res.json({ ok: true });
    } catch (e) {
        console.error("Şablon Silme Hatası:", e.message);
        res.status(500).json({ message: "Silinemedi" });
    }
});

/* ------- ŞABLON SIRA GÜNCELLEME (DRAG & DROP) ------- */
router.post("/api/templates/reorder", requireAuth, async (req, res) => {
    const pool = getPool();
    const { unit, orderedIds } = req.body; // orderedIds: [id1, id2, id3, ...]

    if (!unit || !Array.isArray(orderedIds) || orderedIds.length === 0) {
        return res.status(400).json({ message: "Eksik veri" });
    }

    try {
        // Transaction başlat
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Her ID için SIRA değerini güncelle
            for (let i = 0; i < orderedIds.length; i++) {
                await transaction.request()
                    .input('id', sql.Int, orderedIds[i])
                    .input('sira', sql.Int, i + 1)
                    .input('birim', sql.NVarChar, unit)
                    .query("UPDATE TBL_SHIFT_SABLONLAR SET SIRA = @sira WHERE ID = @id AND BIRIM = @birim");
            }

            await transaction.commit();
            res.json({ ok: true });
        } catch (e) {
            await transaction.rollback();
            throw e;
        }
    } catch (e) {
        console.error("Şablon Sıralama Hatası:", e.message);
        res.status(500).json({ message: "Sıralama kaydedilemedi." });
    }
});

export default router;
