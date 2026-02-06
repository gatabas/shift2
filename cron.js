// jobs/cron.js — Haftalik otomatik arsivleme ve log temizligi
import cron from "node-cron";
import { sql, getPool } from "../lib/db.js";
import { createId } from "../lib/helpers.js";

// Arşivleme Fonksiyonu
async function autoArchiveWeek() {
    try {
        console.log('🗄️  Otomatik arşivleme başlıyor...');

        const now = new Date();

        // Geçen haftanın Pazartesi'sini bul
        const lastWeekMonday = new Date(now);
        lastWeekMonday.setDate(now.getDate() - now.getDay() - 6); // 7 gün geriye + Pazartesi
        lastWeekMonday.setHours(0, 0, 0, 0);

        const year = lastWeekMonday.getFullYear();
        const month = String(lastWeekMonday.getMonth() + 1).padStart(2, '0');
        const day = String(lastWeekMonday.getDate()).padStart(2, '0');
        const weekISO = `${year}-${month}-${day}`;

        console.log(`📅 Arşivlenecek hafta: ${weekISO}`);

        const pool = getPool();

        // Tüm birimleri al
        const unitsResult = await pool.request().query("SELECT BIRIM_ADI FROM TBL_SHIFT_BIRIMLER ORDER BY SIRALAMA");
        const units = unitsResult.recordset.map(u => u.BIRIM_ADI);

        let successCount = 0;
        let errorCount = 0;

        // Her birim için arşivle
        for (const unit of units) {
            try {
                // Zaten arşivlenmiş mi kontrol et
                const checkResult = await pool.request()
                    .input('b', unit)
                    .input('w', weekISO)
                    .query("SELECT COUNT(*) as CNT FROM TBL_SHIFT_ARSIV WHERE BIRIM = @b AND HAFTA_ISO = @w");

                if (checkResult.recordset[0].CNT > 0) {
                    console.log(`⏭️  ${unit} - ${weekISO} zaten arşivlenmiş, atlanıyor`);
                    continue;
                }

                // Shift varsa arşivle
                const shifts = await pool.request()
                    .input('b', unit)
                    .input('w', weekISO)
                    .query("SELECT * FROM TBL_SHIFT_VARDIYA WHERE BIRIM = @b AND HAFTA_ISO = @w");

                if (shifts.recordset.length === 0) {
                    console.log(`⏭️  ${unit} - ${weekISO} shift yok, atlanıyor`);
                    continue;
                }

                // Notları al
                const note = await pool.request()
                    .input('b', unit)
                    .input('w', weekISO)
                    .query("SELECT TOP 1 NOT_ICERIK FROM TBL_SHIFT_NOTLAR WHERE BIRIM = @b AND HAFTA_ISO = @w");

                const data = JSON.stringify({
                    shifts: shifts.recordset,
                    note: note.recordset[0]?.NOT_ICERIK || ""
                });

                const title = `${weekISO} - Otomatik Arşiv`;

                await pool.request()
                    .input('id', createId())
                    .input('b', unit)
                    .input('w', weekISO)
                    .input('t', title)
                    .input('d', data)
                    .query("INSERT INTO TBL_SHIFT_ARSIV (ID, BIRIM, HAFTA_ISO, BASLIK, DATA_JSON, OLUSTURMA_TARIHI) VALUES (@id, @b, @w, @t, @d, GETDATE())");

                successCount++;
                console.log(`✅ ${unit} - ${weekISO} arşivlendi (${shifts.recordset.length} shift)`);

            } catch (e) {
                errorCount++;
                console.error(`❌ ${unit} arşivleme hatası:`, e.message);
            }
        }

        console.log(`\n📊 Arşivleme Özeti:`);
        console.log(`   ✅ Başarılı: ${successCount}`);
        console.log(`   ❌ Hatalı: ${errorCount}`);
        console.log(`   📅 Hafta: ${weekISO}\n`);

    } catch (e) {
        console.error('❌ Otomatik arşivleme genel hatası:', e);
    }
}

// LOG ARŞİVLEME FONKSİYONU
async function archiveLogs() {
    try {
        console.log('📝 Log arşivleme kontrolü başlıyor...');

        const pool = getPool();

        // Ana tablodaki kayıt sayısını kontrol et
        const countResult = await pool.request().query("SELECT COUNT(*) as CNT FROM TBL_SHIFT_LOGS");
        const logCount = countResult.recordset[0].CNT;

        console.log(`   📊 Mevcut log sayısı: ${logCount}`);

        if (logCount > 500) {
            const toArchive = logCount - 500;
            console.log(`   📦 ${toArchive} kayıt arşivlenecek...`);

            // Arşiv tablosu yoksa oluştur
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TBL_SHIFT_LOGS_ARSIV]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE TBL_SHIFT_LOGS_ARSIV (
                        ID INT IDENTITY(1,1) PRIMARY KEY,
                        KULLANICI NVARCHAR(100),
                        ISLEM NVARCHAR(200),
                        DETAY NVARCHAR(MAX),
                        TARIH DATETIME,
                        ARSIVLEME_TARIHI DATETIME DEFAULT GETDATE()
                    )
                END
            `);

            // Eski kayıtları arşive taşı
            await pool.request()
                .input('archiveCount', sql.Int, toArchive)
                .query(`
                    INSERT INTO TBL_SHIFT_LOGS_ARSIV (KULLANICI, ISLEM, DETAY, TARIH)
                    SELECT TOP (@archiveCount) KULLANICI, ISLEM, DETAY, TARIH
                    FROM TBL_SHIFT_LOGS
                    ORDER BY TARIH ASC
                `);

            // Ana tablodan sil
            await pool.request()
                .input('deleteCount', sql.Int, toArchive)
                .query(`
                    DELETE FROM TBL_SHIFT_LOGS
                    WHERE ID IN (
                        SELECT TOP (@deleteCount) ID
                        FROM TBL_SHIFT_LOGS
                        ORDER BY TARIH ASC
                    )
                `);

            console.log(`   ✅ ${toArchive} log arşivlendi ve ana tablodan silindi`);
        } else {
            console.log(`   ✅ Ana tabloda 500'den az kayıt var, arşivleme gerekmiyor`);
        }

    } catch (e) {
        console.error('❌ Log arşivleme hatası:', e);
    }
}

// Cron job'ları başlat
function startCronJobs() {
    console.log('⏰ Otomatik Arşivleme: Her Pazar 23:59 (Europe/Istanbul)\n');

    // KALICI: Her Pazar 23:59
    cron.schedule('59 23 * * 0', () => {
        console.log('📅 HAFTALIK OTOMATİK ARŞIVLEME ÇALIŞIYOR (Pazar 23:59)');
        autoArchiveWeek();
        archiveLogs();
    }, {
        timezone: "Europe/Istanbul"
    });
}

export { startCronJobs };
