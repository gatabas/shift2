/* public/js/tv.js - TABLO FORMATI - PROFESYONEL TASARIM */

// Ayarlar
const REFRESH_RATE = 60000; // 1 Dakika (Veri yenileme)

// DOM
const tableHead = document.querySelector('#shiftTable thead tr');
const tableBody = document.getElementById('shiftTableBody');
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');

// Helper: Saat -> Dakika
function timeToMin(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

// Helper: Dakika -> Saat formatı
function minToTime(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// 1. Saat ve Tarih Güncelle
function updateClock() {
    const now = new Date();
    clockEl.innerText = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    dateEl.innerText = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
}
setInterval(updateClock, 1000);
updateClock();

// 2. Verileri Çek
async function loadTVData() {
    const now = new Date();
    
    // Bugün haftanın hangi günü? (0=Pazar, 1=Pzt, 2=Sal, ..., 6=Cmt)
    const currentDay = now.getDay();
    
    // Pazartesi'ye kadar kaç gün geriye gitmemiz lazım?
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    // Pazartesi'yi bul
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    
    // ISO formatında (YYYY-MM-DD) - Yerel saat ile
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    const weekISO = `${year}-${month}-${day}`;
    
    // Bugün haftanın kaçıncı günü? (0=Pzt, 1=Sal, ..., 6=Paz)
    const dayIdx = currentDay === 0 ? 6 : currentDay - 1;
    
    console.log('Bugün:', now.toLocaleDateString('tr-TR'), 'Current Day:', currentDay, 'Day Index:', dayIdx);
    console.log('Pazartesi:', monday.toLocaleDateString('tr-TR'), 'Week ISO:', weekISO);

    try {
        const res = await fetch(`${API.PUBLIC_TV}?weekISO=${weekISO}&day=${dayIdx}`);
        if (!res.ok) throw new Error("Veri çekilemedi");
        const data = await res.json();
        console.log('TV Data:', data);
        renderTable(data);
    } catch (e) {
        console.error("TV Veri Hatası:", e);
        tableBody.innerHTML = `
            <tr>
                <td colspan="100%" class="p-12 text-center">
                    <div class="flex flex-col items-center gap-4 text-slate-400">
                        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p class="text-xl font-bold">Veri yüklenirken bir hata oluştu</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// 3. Birim İsmini Temizle (Personel tipini kaldır)
function cleanUnitName(birimName) {
    if (!birimName) return '';
    
    // Tüm olası formatlarda personel tipini kaldır:
    // "HALKLA İLİŞKİLER - KADROLU" -> "HALKLA İLİŞKİLER"
    // "HALKLA İLİŞKİLER-KADROLU" -> "HALKLA İLİŞKİLER"
    // "HAVUZ (KISMI ZAMANLI)" -> "HAVUZ"
    // "HAVUZ KISMI ZAMANLI" -> "HAVUZ"
    
    let cleaned = birimName
        // Tire ile ayrılmışları temizle (boşluklu veya boşluksuz)
        .replace(/\s*-\s*(KADROLU|KISMI\s*ZAMANLI|KISMİ\s*ZAMANLI|İŞKUR|ISKUR|STAFF|STUDENT).*$/i, '')
        // Parantez içindekileri temizle
        .replace(/\s*\((KADROLU|KISMI\s*ZAMANLI|KISMİ\s*ZAMANLI|İŞKUR|ISKUR|STAFF|STUDENT).*\)$/i, '')
        // Sonda boşlukla ayrılmışları temizle
        .replace(/\s+(KADROLU|KISMI\s*ZAMANLI|KISMİ\s*ZAMANLI|İŞKUR|ISKUR|STAFF|STUDENT).*$/i, '')
        .trim();
    
    return cleaned;
}

// 4. Ad Soyad Ayırma
function splitName(fullName) {
    if (!fullName) return { firstName: '', lastName: '' };
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' };
    }
    const lastName = parts.pop();
    const firstName = parts.join(' ');
    return { firstName, lastName };
}

// 5. Personel Tipine Göre Renk
function getStaffColor(personelTipi, isActive) {
    // Database'den gelen değeri normalize et
    let normalizedType = 'KADROLU'; // Varsayılan
    
    if (personelTipi) {
        const type = personelTipi.toString().toUpperCase();
        if (type.includes('STUDENT') || type.includes('ÖĞRENCİ') || type.includes('OGRENCI') || type.includes('KISMI') || type.includes('KISMİ')) {
            normalizedType = 'KISMI ZAMANLI';
        } else if (type.includes('ISKUR') || type.includes('İŞKUR')) {
            normalizedType = 'İŞKUR';
        } else if (type.includes('STAFF') || type.includes('KADROLU')) {
            normalizedType = 'KADROLU';
        }
    }
    
    const colors = {
        'KADROLU': {
            active: 'border-2 border-slate-600 text-slate-900',
            inactive: 'border border-slate-400 text-slate-800',
            bg: 'bg-[#D3DCE6]'  // 1. görsel rengi (gri-mavi)
        },
        'KISMI ZAMANLI': {
            active: 'border-2 border-blue-600 text-blue-900',
            inactive: 'border border-blue-400 text-blue-800',
            bg: 'bg-[#C5D9F1]'  // 2. görsel rengi (açık mavi)
        },
        'İŞKUR': {
            active: 'border-2 border-green-600 text-green-900',
            inactive: 'border border-green-400 text-green-800',
            bg: 'bg-[#D7E4BD]'  // 3. görsel rengi (açık yeşil)
        }
    };
    
    const colorSet = colors[normalizedType];
    return `${colorSet.bg} ${isActive ? colorSet.active : colorSet.inactive}`;
}

// 6. Tablo Render
function renderTable(shifts) {
    if (!shifts || shifts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="100%" class="p-12 text-center">
                    <div class="flex flex-col items-center gap-4 text-slate-500">
                        <svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p class="text-2xl font-bold">Şu an aktif vardiya yok</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    // 1. Birimleri Topla (Temizlenmiş isimlerle)
    const units = [...new Set(shifts.map(s => cleanUnitName(s.BIRIM)))].filter(Boolean).sort();
    
    console.log('Units:', units); // Debug
    console.log('Sample shift:', shifts[0]); // Debug
    
    // 2. Birim Başlıklarını Oluştur
    let headHTML = '<th class="time-cell px-6 py-4 text-left border-r border-slate-700"><div class="text-white font-black text-sm uppercase tracking-wider">SAAT</div></th>';
    units.forEach((unit, idx) => {
        const activeCount = shifts.filter(s => {
            const sMin = timeToMin(s.BASLANGIC);
            const eMin = timeToMin(s.BITIS);
            return cleanUnitName(s.BIRIM) === unit && currentMin >= sMin && currentMin < eMin;
        }).length;
        
        headHTML += `
            <th class="unit-cell px-4 py-4 text-left ${idx < units.length - 1 ? 'border-r border-slate-700' : ''}">
                <div class="flex items-center justify-between gap-3">
                    <span class="text-white font-black text-sm uppercase tracking-wide">${unit}</span>
                    ${activeCount > 0 ? `
                        <span class="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <span class="w-1.5 h-1.5 bg-white rounded-full status-pulse"></span>
                            ${activeCount}
                        </span>
                    ` : ''}
                </div>
            </th>
        `;
    });
    tableHead.innerHTML = headHTML;

    // 3. Saat Dilimlerini Bul (30 dakika aralıklarla)
    const timeSlots = new Set();
    shifts.forEach(s => {
        const start = timeToMin(s.BASLANGIC);
        const end = timeToMin(s.BITIS);
        
        // Başlangıç saatini ekle
        timeSlots.add(start);
        
        // Ara saatleri 30 dakikalık dilimler halinde ekle
        for (let t = start; t < end; t += 30) {
            timeSlots.add(t);
        }
    });
    
    const sortedSlots = Array.from(timeSlots).sort((a, b) => a - b);

    // 4. Her Saat Dilimi için Satır Oluştur
    let bodyHTML = '';
    
    sortedSlots.forEach(slot => {
        const timeStr = minToTime(slot);
        const nextSlot = slot + 30;
        
        bodyHTML += `<tr class="border-b border-slate-100 hover:bg-slate-50 transition">`;
        
        // Saat Hücresi
        bodyHTML += `
            <td class="time-cell px-6 py-4 border-r border-slate-200">
                <div class="font-black text-lg text-slate-900 font-mono">${timeStr}</div>
            </td>
        `;
        
        // Her Birim için Hücre
        units.forEach((unit, idx) => {
            // Bu saat diliminde bu birimde çalışan personelleri bul
            const staff = shifts.filter(s => {
                if (cleanUnitName(s.BIRIM) !== unit) return false;
                const sMin = timeToMin(s.BASLANGIC);
                const eMin = timeToMin(s.BITIS);
                return slot >= sMin && slot < eMin;
            });
            
            bodyHTML += `<td class="unit-cell px-3 py-3 ${idx < units.length - 1 ? 'border-r border-slate-200' : ''}">`;
            
            if (staff.length > 0) {
                bodyHTML += '<div class="staff-grid">';
                
                staff.forEach(p => {
                    const sMin = timeToMin(p.BASLANGIC);
                    const eMin = timeToMin(p.BITIS);
                    const isActive = currentMin >= sMin && currentMin < eMin;
                    const colorClass = getStaffColor(p.PERSONEL_TIPI, isActive);
                    
                    bodyHTML += `
                        <div class="staff-card flex items-center justify-center px-2 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${colorClass} shadow-sm">
                            ${p.AD_SOYAD}
                        </div>
                    `;
                });
                
                bodyHTML += '</div>';
            } else {
                bodyHTML += '<div class="text-slate-300 text-xs font-medium text-center py-2">-</div>';
            }
            
            bodyHTML += '</td>';
        });
        
        bodyHTML += '</tr>';
    });

    tableBody.innerHTML = bodyHTML;
}

// Başlat
loadTVData();
setInterval(loadTVData, REFRESH_RATE);