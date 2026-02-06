/* public/js/logs.js */

// Değişkenler
let currentPage = 1;
const logsPerPage = 25;
let totalLogs = 0;
let totalPages = 0;

async function api(path) {
    let p = path.startsWith('/') ? path.slice(1) : path;
    if (!p.startsWith('shift/')) p = 'shift/' + p;
    try {
        const res = await fetch('/' + p, { credentials: 'include' });
        if (!res.ok) throw new Error('Hata');
        return await res.json();
    } catch (e) { return null; }
}

function fmtDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    d.setHours(d.getHours() - 3); // UTC → Türkiye saati

    return d.toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

async function loadLogs() {
    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400 animate-pulse">Veriler yükleniyor...</td></tr>';

    // Server-side pagination ile veri çek
    const data = await api(`${API.LOGS}?page=${currentPage}&limit=${logsPerPage}`);
    
    if (!data || !data.logs) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400">Kayıt bulunamadı.</td></tr>';
        return;
    }
    
    totalLogs = data.total || 0;
    totalPages = data.pages || 1;
    
    document.getElementById('totalLogs').innerText = totalLogs;
    document.getElementById('pageIndicator').innerText = `${currentPage} / ${totalPages}`;
    
    // Buton Durumları
    document.getElementById('btnPrev').disabled = currentPage === 1;
    document.getElementById('btnNext').disabled = currentPage >= totalPages;

    renderLogs(data.logs);
}

function renderLogs(logs) {
    const tbody = document.getElementById('logsTableBody');
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400">Kayıt bulunamadı.</td></tr>';
        return;
    }

    // TABLO SATIRLARINI OLUŞTUR
    tbody.innerHTML = logs.map(log => {
        // İşlem Rengi
        let badgeColor = 'bg-blue-100 text-blue-700';
        if ((log.ISLEM || '').includes('Sil')) badgeColor = 'bg-red-100 text-red-700';
        else if ((log.ISLEM || '').includes('Ekle') || (log.ISLEM || '').includes('Kaydet')) badgeColor = 'bg-green-100 text-green-700';

        return `
        <tr class="flex flex-col md:table-row bg-white md:bg-transparent p-4 md:p-0 mb-3 md:mb-0 rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-slate-200 md:border-0 md:border-b md:border-slate-100 relative overflow-hidden">
            
            <div class="absolute left-0 top-0 bottom-0 w-1 md:hidden ${badgeColor.replace('bg-', 'bg-').replace('100', '500')}"></div>

            <td class="hidden md:table-cell p-4 text-slate-400 font-mono text-xs w-20">#${log.ID}</td>
            
            <td class="md:table-cell md:p-4 pb-1 md:pb-0 pl-3 md:pl-4">
                <div class="flex md:hidden justify-between items-center mb-1">
                    <div class="font-bold text-slate-800 text-sm">${log.KULLANICI || 'Sistem'}</div>
                    <div class="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">${fmtDate(log.TARIH)}</div>
                </div>
                <div class="hidden md:block font-bold text-slate-700">${log.KULLANICI || 'Sistem'}</div>
            </td>

            <td class="md:table-cell md:p-4 pb-2 md:pb-0 pl-3 md:pl-4">
                <div>
                    <span class="inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${badgeColor}">
                        ${log.ISLEM}
                    </span>
                </div>
            </td>

            <td class="md:table-cell md:p-4 pl-3 md:pl-4 text-sm text-slate-600 leading-snug break-words">
                ${log.DETAY}
            </td>

            <td class="hidden md:table-cell p-4 text-right text-slate-400 text-xs font-mono">
                ${fmtDate(log.TARIH)}
            </td>
        </tr>
    `}).join('');
}

function changePage(direction) {
    currentPage += direction;
    loadLogs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', loadLogs);