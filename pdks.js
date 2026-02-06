import { Router } from "express";
import { getPool } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

/* ============================================
   PDKS KARŞILAŞTIRMA SİSTEMİ
   ============================================ */

// PDKS WEB SERVİS MOCK (Gerçeği gelene kadar test için)
const PDKS_MOCK_DATA = [
    { personelId: 1, tarih: '2026-01-28', giris: '08:05', cikis: '17:10' },
    { personelId: 2, tarih: '2026-01-28', giris: '08:30', cikis: '16:45' },
    { personelId: 3, tarih: '2026-01-28', giris: null, cikis: null }, // Gelmemiş
];

// Yardımcı: Saat → Dakika
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

// PDKS Web Servis Çağrısı (Gerçeği gelince burası değişecek)
async function fetchPDKSData(unit, weekISO) {
    // TODO: Rektörlükten gelecek web servis buraya entegre edilecek
    // Örnek URL: https://pdks.pau.edu.tr/api/getRecords?unit=X&startDate=X&endDate=X

    // ŞİMDİLİK MOCK DATA DÖN
    return PDKS_MOCK_DATA;
}

// Karşılaştırma Algoritması
function compareShiftWithPDKS(ourShifts, pdksData) {
    const results = [];

    ourShifts.forEach(shift => {
        const shiftDate = new Date(shift.HAFTA_ISO);
        shiftDate.setDate(shiftDate.getDate() + shift.GUN);
        const dateStr = shiftDate.toISOString().split('T')[0];

        // PDKS'de bu personelin bu gündeki kaydını bul
        const pdksRecord = pdksData.find(p =>
            p.personelId == shift.PERSONEL_ID &&
            p.tarih === dateStr
        );

        // Karşılaştırma
        let status = 'unknown';
        let details = {};

        if (!pdksRecord || (!pdksRecord.giris && !pdksRecord.cikis)) {
            // PDKS'de kayıt yok
            status = 'missing';
            details = {
                message: 'PDKS kaydı bulunamadı',
                color: 'red'
            };
        } else {
            // Giriş kontrolü
            const shiftStart = timeToMinutes(shift.BASLANGIC);
            const pdksStart = timeToMinutes(pdksRecord.giris);
            const startDiff = pdksStart - shiftStart; // Pozitif = geç, Negatif = erken

            // Çıkış kontrolü
            const shiftEnd = timeToMinutes(shift.BITIS);
            const pdksEnd = timeToMinutes(pdksRecord.cikis);
            const endDiff = pdksEnd - shiftEnd;

            // Durum belirleme
            if (Math.abs(startDiff) <= 5 && Math.abs(endDiff) <= 5) {
                status = 'on-time';
                details = { message: 'Tam zamanında', color: 'green' };
            } else if (startDiff > 5 && startDiff <= 15) {
                status = 'late-minor';
                details = { message: `${startDiff} dk geç geldi`, color: 'yellow' };
            } else if (startDiff > 15 && startDiff <= 30) {
                status = 'late-moderate';
                details = { message: `${startDiff} dk geç geldi`, color: 'orange' };
            } else if (startDiff > 30) {
                status = 'late-major';
                details = { message: `${startDiff} dk geç geldi`, color: 'red' };
            } else if (startDiff < -5) {
                status = 'early';
                details = { message: `${Math.abs(startDiff)} dk erken geldi`, color: 'blue' };
            }

            // Çıkış durumu ekle
            if (Math.abs(endDiff) > 5) {
                details.exitNote = endDiff > 0
                    ? `${endDiff} dk geç çıktı`
                    : `${Math.abs(endDiff)} dk erken çıktı`;
            }
        }

        results.push({
            personelId: shift.PERSONEL_ID,
            personelAd: shift.AD_SOYAD,
            gun: shift.GUN,
            tarih: dateStr,
            planned: {
                start: shift.BASLANGIC,
                end: shift.BITIS,
                task: shift.GOREV
            },
            actual: {
                start: pdksRecord?.giris || null,
                end: pdksRecord?.cikis || null
            },
            status,
            details
        });
    });

    return results;
}

// PDKS Karşılaştırma Endpoint'i
router.get('/api/pdks/compare', requireAuth, async (req, res) => {
    const pool = getPool();
    const { unit, weekISO } = req.query;

    if (!unit || !weekISO) {
        return res.status(400).json({ message: 'Birim ve hafta bilgisi gerekli' });
    }

    try {
        // 1. Bizim sistemdeki shift'leri al
        const ourShifts = await pool.request()
            .input('unit', unit)
            .input('week', weekISO)
            .query(`
                SELECT
                    v.PERSONEL_ID,
                    p.AD_SOYAD,
                    v.HAFTA_ISO,
                    v.GUN,
                    v.BASLANGIC,
                    v.BITIS,
                    v.GOREV,
                    v.ETIKET
                FROM TBL_SHIFT_VARDIYA v
                JOIN TBL_SHIFT_PERSONEL p ON v.PERSONEL_ID = p.ID
                WHERE v.BIRIM = @unit
                  AND v.HAFTA_ISO = @week
                  AND (v.ETIKET IS NULL OR v.ETIKET = '')
                ORDER BY p.AD_SOYAD, v.GUN, v.BASLANGIC
            `);

        // 2. PDKS verilerini al
        const pdksData = await fetchPDKSData(unit, weekISO);

        // 3. Karşılaştırma yap
        const comparison = compareShiftWithPDKS(ourShifts.recordset, pdksData);

        res.json({
            success: true,
            data: comparison,
            summary: {
                total: comparison.length,
                onTime: comparison.filter(c => c.status === 'on-time').length,
                late: comparison.filter(c => ['late-minor', 'late-moderate', 'late-major'].includes(c.status)).length,
                missing: comparison.filter(c => c.status === 'missing').length,
                early: comparison.filter(c => c.status === 'early').length
            }
        });

    } catch (err) {
        console.error('PDKS Karşılaştırma Hatası:', err);
        res.status(500).json({ message: 'Karşılaştırma sırasında bir hata oluştu.' });
    }
});

export default router;
