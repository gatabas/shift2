/* stats.js - PHASE 1 + 2 + 3 - SON SURUM */
console.log('Stats Panel - FULL VERSION');

let allData = null;

async function api(path) {
    let p = path.startsWith('/') ? path.slice(1) : path;
    try {
        const r = await fetch('/' + p, { credentials: 'include' });
        if (!r.ok) { 
            if (r.status === 403) window.location.href = 'index.html';
            throw new Error('API Error: ' + r.status); 
        }
        return await r.json();
    } catch (e) { 
        console.error('API Call Failed:', e); 
        return null; 
    }
}

function destroyAllCharts() {
    if (typeof Chart !== 'undefined' && Chart.instances) {
        Object.values(Chart.instances).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
}

async function loadStats(filteredData = null) {
    console.log('Loading statistics...');
    destroyAllCharts();
    
    // Eğer filtreli veri varsa onu kullan, yoksa normal API çağrısı yap
    const data = filteredData || await api('shift/' + API.STATISTICS);
    
    if (!data) {
        console.error('No data received!');
        return;
    }
    
    console.log('Data received:', data);
    allData = data;

    // 1. Kartlar
    document.getElementById('stat-total-staff').innerText = data.summary?.totalStaff || '-';
    document.getElementById('stat-total-shifts').innerText = data.summary?.totalShifts || '-';
    document.getElementById('stat-total-leaves').innerText = data.summary?.totalLeaves || '-';
    document.getElementById('stat-total-units').innerText = data.staffByUnit?.length || '-';

    // 2. Grafikler
    if (data.shiftsByUnit && data.shiftsByUnit.length > 0) {
        new Chart(document.getElementById('chartShiftsByUnit'), {
            type: 'bar',
            data: {
                labels: data.shiftsByUnit.map(x => x.BIRIM),
                datasets: [{
                    label: 'Vardiya Sayisi',
                    data: data.shiftsByUnit.map(x => x.count),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    if (data.staffByType && data.staffByType.length > 0) {
        const typeLabels = { 'staff': 'Kadrolu', 'student': 'Ogrenci', 'iskur': 'Iskur' };
        const typeColors = { 'staff': '#ea580c', 'student': '#3b82f6', 'iskur': '#10b981' };
        new Chart(document.getElementById('chartStaffType'), {
            type: 'doughnut',
            data: {
                labels: data.staffByType.map(x => typeLabels[x.PERSONEL_TIPI] || x.PERSONEL_TIPI),
                datasets: [{
                    data: data.staffByType.map(x => x.count),
                    backgroundColor: data.staffByType.map(x => typeColors[x.PERSONEL_TIPI] || '#ccc'),
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    if (data.leavesByType && data.leavesByType.length > 0) {
        const leaveLabels = { 'YILLIK': 'Yillik Izin', 'RAPOR': 'Rapor', 'IDARI': 'Idari Izin', 'HAFTALIK': 'Haftalik Tatil' };
        const leaveColors = { 'YILLIK': '#ef4444', 'RAPOR': '#22c55e', 'IDARI': '#f97316', 'HAFTALIK': '#a855f7' };
        new Chart(document.getElementById('chartLeaves'), {
            type: 'pie',
            data: {
                labels: data.leavesByType.map(x => leaveLabels[x.ETIKET] || x.ETIKET),
                datasets: [{
                    data: data.leavesByType.map(x => x.count),
                    backgroundColor: data.leavesByType.map(x => leaveColors[x.ETIKET] || '#94a3b8'),
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // 3. Top Staff Table
    const tableBody = document.getElementById('topStaffTable');
    if (!data.topStaff || data.topStaff.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400">Veri yok</td></tr>';
    } else {
        tableBody.innerHTML = data.topStaff.map((p, i) => `
            <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
                <td class="p-3 font-bold text-slate-500">#${i + 1}</td>
                <td class="p-3 font-bold text-slate-700">${p.AD_SOYAD}</td>
                <td class="p-3 text-right font-mono font-bold text-blue-600">${p.count}</td>
                <td class="p-3 text-right"><span class="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">AKTIF</span></td>
            </tr>
        `).join('');
    }
    
    // 4. Phase 1: Risk & Staff Details
    if (data.riskAnalysis) renderRiskAnalysis(data.riskAnalysis, data.summary);
    if (data.workHours) renderStaffDetails(data.workHours, data.leavePatterns, data.riskAnalysis);
    
    // 5. Phase 2: Performance, Heatmap, Trend
    if (data.performanceScores) renderPerformanceScores(data.performanceScores);
    if (data.heatmapData) renderHeatmap(data.heatmapData);
    if (data.trendData) renderTrendChart(data.trendData);
    if (data.predictions) renderPredictions(data.predictions);
    
    // 6. Birim listesini doldur
    if (data.staffByUnit) populateUnitFilter(data.staffByUnit);
    
    console.log('All data rendered successfully!');
}

function renderRiskAnalysis(risks, summary) {
    const highEl = document.getElementById('risk-high');
    const mediumEl = document.getElementById('risk-medium');
    const normalEl = document.getElementById('risk-normal');

    if (highEl) highEl.innerText = summary?.highRiskCount || 0;
    if (mediumEl) mediumEl.innerText = summary?.mediumRiskCount || 0;
    if (normalEl) normalEl.innerText = (summary?.totalStaff - (summary?.highRiskCount || 0) - (summary?.mediumRiskCount || 0)) || 0;
    
    const riskList = document.getElementById('riskList');
    if (!riskList) return;
    
    if (!risks || risks.length === 0) {
        riskList.innerHTML = '<div class="text-center text-green-600 py-8 font-bold">Tüm personel normal!</div>';
        return;
    }
    
    riskList.innerHTML = risks.sort((a,b) => {
        const o = {high:0, medium:1, low:2};
        return o[a.riskLevel] - o[b.riskLevel];
    }).map(r => `
        <div class="border-2 ${r.riskLevel==='high'?'bg-red-50 border-red-300':'bg-yellow-50 border-yellow-300'} rounded-xl p-4">
            <div class="flex justify-between mb-2">
                <div class="font-black text-lg">${r.riskLevel==='high'?'YUKSEK':'ORTA'} ${r.name}</div>
                <span class="px-3 py-1 rounded-full text-xs font-bold">${r.riskLevel==='high'?'ACIL':'DIKKAT'}</span>
            </div>
            <div class="font-bold">${r.reason}</div>
            <div class="text-sm opacity-70">${r.detail}</div>
        </div>
    `).join('');
}

function renderStaffDetails(workHours, leavePatterns, risks) {
    const list = document.getElementById('staffDetailList');
    if (!list || !workHours) return;
    
    const staffData = workHours.map(w => ({
        ...w,
        izin_sayisi: leavePatterns?.find(l=>l.ID===w.ID)?.izin_sayisi || 0,
        izin_detay: leavePatterns?.find(l=>l.ID===w.ID)?.izin_detay || 'Izin yok',
        riskLevel: risks?.find(r=>r.id===w.ID)?.riskLevel || 'low'
    }));
    
    list.innerHTML = staffData.map(s => `
        <div class="border-2 ${s.riskLevel==='high'?'border-red-500 bg-red-50':s.riskLevel==='medium'?'border-yellow-500 bg-yellow-50':'border-slate-200 bg-white'} rounded-xl p-4">
            <div class="flex justify-between mb-3">
                <div class="font-black text-lg">${s.AD_SOYAD}</div>
                <span class="text-2xl">${s.riskLevel==='high'?'RISK':s.riskLevel==='medium'?'DIKKAT':'OK'}</span>
            </div>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between"><span>Birim:</span><b>${s.BIRIM}</b></div>
                <div class="flex justify-between"><span>Vardiya:</span><b class="text-blue-600">${s.toplam_vardiya}</b></div>
                <div class="flex justify-between"><span>Saat:</span><b class="text-emerald-600">${s.toplam_saat.toFixed(1)}</b></div>
                <div class="flex justify-between"><span>Izin:</span><b class="${s.izin_sayisi>=3?'text-red-600':'text-slate-700'}">${s.izin_sayisi}</b></div>
            </div>
            ${s.izin_sayisi>0?`<div class="mt-3 pt-3 border-t text-xs"><b>Izin:</b> ${s.izin_detay}</div>`:''}
        </div>
    `).join('');
}

function renderPerformanceScores(scores) {
    const list = document.getElementById('performanceList');
    if (!list || !scores) return;
    
    list.innerHTML = scores.slice(0,12).map(s => {
        const gc = {A:'from-green-500 to-emerald-500',B:'from-blue-500 to-cyan-500',C:'from-yellow-500 to-orange-500',D:'from-red-500 to-pink-500'};
        const ge = {A:'A',B:'B',C:'C',D:'D'};
        return `
            <div class="border-2 rounded-xl p-4 hover:shadow-xl transition">
                <div class="flex justify-between mb-3">
                    <div class="font-black text-lg">${s.name}</div>
                    <div class="text-3xl">${ge[s.grade]}</div>
                </div>
                <div class="mb-4">
                    <div class="flex justify-between mb-1">
                        <span class="text-xs font-bold">SKOR</span>
                        <span class="text-xs font-bold bg-gradient-to-r ${gc[s.grade]} text-transparent bg-clip-text">${s.score}/100</span>
                    </div>
                    <div class="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r ${gc[s.grade]}" style="width:${s.score}%"></div>
                    </div>
                </div>
                <div class="space-y-1 text-xs">
                    <div class="flex justify-between"><span>Duzenlilik:</span><b>${s.regularity}/25</b></div>
                    <div class="flex justify-between"><span>Izin:</span><b>${s.leaves}/25</b></div>
                    <div class="flex justify-between"><span>Mesai:</span><b>${s.overtime}/20</b></div>
                </div>
                <div class="mt-3 pt-3 border-t">
                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${gc[s.grade]} text-white">NOT: ${s.grade}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderHeatmap(data) {
    const c = document.getElementById('heatmapContainer');
    if (!c || !data) return;
    
    const days = ['Pazartesi','Sali','Carsamba','Persembe','Cuma','Cumartesi','Pazar'];
    const maxY = Math.max(...data.map(d=>d.yogunluk), 1);
    
    let h = '<div class="grid grid-cols-8 gap-1"><div></div>';
    days.forEach(d => h += `<div class="text-xs font-bold text-center p-2">${d.substring(0,3)}</div>`);
    
    for(let hr=0; hr<24; hr++) {
        h += `<div class="text-xs font-bold text-right pr-2 py-2">${hr}:00</div>`;
        for(let dy=0; dy<7; dy++) {
            const cell = data.find(d=>d.gun===dy && d.saat===hr);
            const y = cell ? cell.yogunluk : 0;
            const i = y/maxY;
            const bg = i>0.8?'bg-red-600':i>0.6?'bg-red-400':i>0.4?'bg-orange-400':i>0.2?'bg-yellow-300':i>0?'bg-yellow-100':'bg-slate-100';
            h += `<div class="${bg} rounded p-2 text-center text-xs font-bold" title="${days[dy]} ${hr}:00 - ${y}">${y||''}</div>`;
        }
    }
    h += '</div>';
    c.innerHTML = h;
}

function renderTrendChart(data) {
    if (!data || data.length === 0) return;
    
    new Chart(document.getElementById('chartTrend'), {
        type: 'line',
        data: {
            labels: data.map(t => new Date(t.hafta).toLocaleDateString('tr-TR', {day:'2-digit',month:'2-digit'})),
            datasets: [
                {label:'Vardiya',data:data.map(t=>t.vardiya_sayisi),borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,0.1)',fill:true,tension:0.4},
                {label:'Izin',data:data.map(t=>t.izin_sayisi),borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,0.1)',fill:true,tension:0.4}
            ]
        },
        options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true,position:'bottom'}}, scales:{y:{beginAtZero:true}}}
    });
}

function renderPredictions(p) {
    const c = document.getElementById('predictionsContainer');
    if (!c || !p) return;
    
    let h = '';
    if (p.nextMonthLeaves && p.nextMonthLeaves.length > 0) {
        h += `<div class="border-2 border-orange-200 bg-orange-50 rounded-xl p-4">
            <div class="font-bold text-orange-900 mb-2">Izin Alabilecek (${p.nextMonthLeaves.length})</div>
            <div class="space-y-2">${p.nextMonthLeaves.slice(0,5).map(x=>`
                <div class="flex justify-between text-sm">
                    <b>${x.name}</b>
                    <div class="flex gap-2 items-center">
                        <span class="text-xs">${x.reason}</span>
                        <div class="w-16 h-2 bg-orange-200 rounded-full overflow-hidden"><div class="h-full bg-orange-500" style="width:${x.probability}%"></div></div>
                        <span class="text-xs font-bold">${x.probability}%</span>
                    </div>
                </div>
            `).join('')}</div>
        </div>`;
    }
    
    if (p.staffShortage && p.staffShortage.length > 0) {
        h += `<div class="border-2 border-red-200 bg-red-50 rounded-xl p-4">
            <div class="font-bold text-red-900 mb-2">Eleman Eksikligi (${p.staffShortage.length})</div>
            ${p.staffShortage.map(s=>`<div class="flex justify-between text-sm"><b>${s.unit}</b><span class="px-2 py-1 rounded-full text-xs font-bold ${s.count>=3?'bg-red-500 text-white':'bg-red-200 text-red-800'}">${s.count} personel</span></div>`).join('')}
        </div>`;
    }
    
    h += `<div class="border-2 border-green-200 bg-green-50 rounded-xl p-4">
        <div class="font-bold text-green-900 mb-2">Butce Tahmini</div>
        <div class="text-3xl font-black text-green-700">${p.budgetForecast.toLocaleString('tr-TR')} TL</div>
        <div class="text-xs text-green-600 mt-1">Ortalama saat x personel x 50 TL</div>
    </div>`;
    
    c.innerHTML = h;
}

function populateUnitFilter(units) {
    const s = document.getElementById('filterUnit');
    if (!s) return;
    units.forEach(u => {
        const o = document.createElement('option');
        o.value = u.BIRIM;
        o.textContent = u.BIRIM;
        s.appendChild(o);
    });
}

// ==========================================
// 📄 PDF & EXCEL EXPORT MODÜLÜ
// ==========================================

async function exportPDF() {
    // Kütüphane kontrolü
    if (!window.jspdf || !window.html2canvas) {
        alert('PDF kütüphaneleri yüklenemedi! Lütfen sayfayı yenileyin.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4'); // A4 Dikey
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Butonu "Hazırlanıyor" moduna al
    const btn = event ? event.currentTarget : null;
    let oldText = '';
    if (btn) { oldText = btn.innerHTML; btn.innerHTML = '⏳ İşleniyor...'; btn.disabled = true; }

    try {
        // --- 1. HEADER & LOGO ---
        // Logoyu sayfadan alalım (HTML'de img/logo.png var)
        const logoImg = document.querySelector('img[src*="logo"]');
        if (logoImg) {
            try {
                // Resmi canvas'a çizip base64 alalım (CORS sorunu olmaması için)
                const c = document.createElement('canvas');
                c.width = logoImg.naturalWidth; c.height = logoImg.naturalHeight;
                c.getContext('2d').drawImage(logoImg, 0, 0);
                const logoData = c.toDataURL('image/png');
                doc.addImage(logoData, 'PNG', 15, 10, 15, 15); // x, y, w, h
            } catch (e) { console.warn('Logo eklenemedi:', e); }
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text("PAÜ SPOR MERKEZİ", 35, 16);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text("YÖNETİCİ ÖZET RAPORU", 35, 22);

        doc.setFontSize(10);
        doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, pageWidth - 15, 16, { align: 'right' });

        // Çizgi Çek
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 28, pageWidth - 15, 28);

        let yPos = 40;

        // --- 2. ÖZET KARTLAR (Metin Olarak) ---
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("1. GENEL DURUM", 15, yPos);
        yPos += 8;

        const stats = [
            `Toplam Personel: ${document.getElementById('stat-total-staff')?.innerText || '-'}`,
            `Toplam Vardiya: ${document.getElementById('stat-total-shifts')?.innerText || '-'}`,
            `Kullanılan İzin: ${document.getElementById('stat-total-leaves')?.innerText || '-'}`,
            `Riskli Personel: ${document.getElementById('risk-high')?.innerText || '0'}`
        ];

        doc.setFontSize(10);
        stats.forEach((s, i) => {
            doc.text(`• ${s}`, 20, yPos + (i * 6));
        });
        yPos += 30;

        // --- 3. GRAFİKLERİ YAKALA (html2canvas) ---
        // Sadece önemli grafikleri alalım
        const chartsToCapture = [
            { id: 'chartShiftsByUnit', title: '2. BİRİM YOĞUNLUK DAĞILIMI' },
            { id: 'chartTrend', title: '3. 3 AYLIK TREND ANALİZİ' }
        ];

        for (const chart of chartsToCapture) {
            const el = document.getElementById(chart.id);
            if (el) {
                // Sayfa sonu kontrolü
                if (yPos > 240) { doc.addPage(); yPos = 20; }

                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text(chart.title, 15, yPos);
                yPos += 5;

                // Grafiği resme çevir
                const canvas = await html2canvas(el, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                
                // Resmi sayfaya sığdır
                const imgWidth = pageWidth - 40;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                doc.addImage(imgData, 'PNG', 20, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 15;
            }
        }

        // --- 4. GELECEK TAHMİNLERİ (ML Verisi) ---
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14);
        doc.text("4. YAPAY ZEKA TAHMİNLERİ", 15, yPos);
        yPos += 10;

        const predictionsDiv = document.getElementById('predictionsContainer');
        if (predictionsDiv) {
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            // Sadece metin içeriğini alıp temizleyelim
            const text = predictionsDiv.innerText.replace(/\n+/g, '\n');
            const splitText = doc.splitTextToSize(text, pageWidth - 40);
            doc.text(splitText, 20, yPos);
        }

        // --- 5. FOOTER (Sayfa Altı) ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Bu rapor PAÜ Shift AI Sistemi tarafından otomatik oluşturulmuştur. Sayfa ${i}/${pageCount}`, pageWidth / 2, 285, { align: 'center' });
        }

        // Kaydet
        doc.save(`PAU_Rapor_${new Date().toISOString().slice(0,10)}.pdf`);

    } catch (err) {
        console.error('PDF Hatası:', err);
        alert('PDF oluşturulurken bir hata oluştu: ' + err.message);
    } finally {
        if (btn) { btn.innerHTML = oldText; btn.disabled = false; }
    }
}

function exportExcel() {
    if (!typeof XLSX) { alert('Excel kütüphanesi eksik!'); return; }
    if (!allData) { alert('Veri yüklenmedi!'); return; }

    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toLocaleDateString('tr-TR');

    // --- SHEET 1: ÖZET (Dashboard) ---
    const summaryData = [
        ["RAPOR BİLGİLERİ"],
        ["Kurum", "Pamukkale Üniversitesi Spor Merkezi"],
        ["Tarih", dateStr],
        ["Oluşturan", "Yapay Zeka Destekli Yönetim Paneli"],
        [],
        ["GENEL İSTATİSTİKLER"],
        ["Toplam Personel", allData.summary?.totalStaff],
        ["Toplam Vardiya", allData.summary?.totalShifts],
        ["Kullanılan İzin", allData.summary?.totalLeaves],
        ["Ortalama Çalışma (Saat)", allData.summary?.avgWorkHours],
        ["Yüksek Riskli Personel", allData.summary?.highRiskCount]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Genel Özet");

    // --- SHEET 2: PERSONEL DETAY (Ham Veri) ---
    if (allData.workHours) {
        // Veriyi düzleştirelim (Flatten)
        const staffRows = allData.workHours.map(s => {
            const izin = allData.leavePatterns?.find(l => l.ID === s.ID);
            const perf = allData.performanceScores?.find(p => p.id === s.ID);
            return {
                "ID": s.ID,
                "Ad Soyad": s.AD_SOYAD,
                "Birim": s.BIRIM,
                "Toplam Vardiya": s.toplam_vardiya,
                "Toplam Saat": s.toplam_saat,
                "Kullanılan İzin": izin ? izin.izin_sayisi : 0,
                "İzin Detayları": izin ? izin.izin_detay : "-",
                "Performans Puanı": perf ? perf.score : "-",
                "Performans Notu": perf ? perf.grade : "-"
            };
        });
        const wsStaff = XLSX.utils.json_to_sheet(staffRows);
        // Sütun genişlikleri
        wsStaff['!cols'] = [{wch:30}, {wch:20}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:40}];
        XLSX.utils.book_append_sheet(wb, wsStaff, "Personel Listesi");
    }

    // --- SHEET 3: ML TAHMİNLERİ (AI Predictions) ---
    if (allData.predictions) {
        const aiRows = [];
        
        // İzin Tahminleri
        if (allData.predictions.nextMonthLeaves) {
            allData.predictions.nextMonthLeaves.forEach(p => {
                aiRows.push({ "Kategori": "İzin Tahmini", "Detay": p.name, "Olasılık/Değer": `%${p.probability}`, "Açıklama": p.reason });
            });
        }
        
        // Eleman Eksikliği
        if (allData.predictions.staffShortage) {
            allData.predictions.staffShortage.forEach(s => {
                aiRows.push({ "Kategori": "Personel Eksiği", "Detay": s.unit, "Olasılık/Değer": `${s.count} Kişi`, "Açıklama": "Yoğunluk öngörülüyor" });
            });
        }

        // Bütçe
        aiRows.push({ "Kategori": "Bütçe Tahmini", "Detay": "Gelecek Ay", "Olasılık/Değer": `${allData.predictions.budgetForecast} TL`, "Açıklama": "Tahmini mesai maliyeti" });

        const wsAI = XLSX.utils.json_to_sheet(aiRows);
        wsAI['!cols'] = [{wch:20}, {wch:25}, {wch:15}, {wch:40}];
        XLSX.utils.book_append_sheet(wb, wsAI, "Yapay Zeka Analizi");
    }

    // Dosyayı İndir
    XLSX.writeFile(wb, `PAU_Stats_Data_${new Date().toISOString().slice(0,10)}.xlsx`);
}
function printReport() { window.print(); }
function shareReport() {
    if (navigator.share) navigator.share({title:'PAU Stats',url:location.href});
    else alert('Paylasim desteklenmiyor');
}

async function applyFilters() {
    const dr = document.getElementById('filterDateRange').value;
    const u = document.getElementById('filterUnit').value;
    const st = document.getElementById('filterStaffType').value;
    const r = document.getElementById('filterRisk').value;
    
    console.log('Filtreler:', {tarih: dr, birim: u, tip: st, risk: r});
    
    const params = new URLSearchParams({dateRange:dr, unit:u, staffType:st, risk:r});
    const data = await api(`shift/${API.STATISTICS}?${params}`);
    if (data) {
        console.log('Filtreli veri alindi:', data);
        allData = data;
        // FİLTRELİ VERİYİ GÖNDER!
        loadStats(data);
    }
}

function resetFilters() {
    document.getElementById('filterDateRange').value = '30';
    document.getElementById('filterUnit').value = 'all';
    document.getElementById('filterStaffType').value = 'all';
    document.getElementById('filterRisk').value = 'all';
    loadStats();
}

function saveFilters() {
    const f = {
        dateRange: document.getElementById('filterDateRange').value,
        unit: document.getElementById('filterUnit').value,
        staffType: document.getElementById('filterStaffType').value,
        risk: document.getElementById('filterRisk').value
    };
    localStorage.setItem('statsFilters', JSON.stringify(f));
    alert('Filtreler kaydedildi!');
}

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    
    const saved = localStorage.getItem('statsFilters');
    if (saved) {
        const f = JSON.parse(saved);
        document.getElementById('filterDateRange').value = f.dateRange || '30';
        document.getElementById('filterUnit').value = f.unit || 'all';
        document.getElementById('filterStaffType').value = f.staffType || 'all';
        document.getElementById('filterRisk').value = f.risk || 'all';
    }
});