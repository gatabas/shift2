/* public/js/dashboard.js */

// --- Live Dashboard Bileşeni ---
function LiveDashboard({ localShifts, staff, now, weekISO, isAdmin, isManager, currentUnit, currentUser }) {
    const [mode, setMode] = useState('local');
    const [globalData, setGlobalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const currentDayIdx = (now.getDay() + 6) % 7;
    const currentMin = now.getHours() * 60 + now.getMinutes();

    // SADECE 'fitness' kullanıcısı için özel görünüm
    const isFitnessUser = currentUser?.username === 'fitness';

    useEffect(() => {
        if (mode === 'global' && (isAdmin || isManager || isFitnessUser)) {
            setLoading(true);
            api(`${API.LIVE_ALL}?weekISO=${weekISO}&day=${currentDayIdx}`).then(data => { setGlobalData(data || []); setLoading(false); }).catch((err) => { setGlobalData([]); setLoading(false); });
        } else if (mode === 'local') { setLoading(false); }
    }, [mode, weekISO, currentDayIdx, isAdmin, isManager, isFitnessUser]);

    let displayShifts = [];
    if (mode === 'local') {
        displayShifts = localShifts.filter(s => {
            if (s.day !== currentDayIdx) return false;
            if (!s.start || !s.end) return false;
            if (['YILLIK', 'IDARI', 'HAFTALIK', 'RAPOR'].includes(s.tag)) return false;
            const startMin = timeToMin(s.start);
            const endMin = timeToMin(s.end);
            return currentMin >= startMin && currentMin < endMin;
        }).map(s => {
            const person = staff.find(p => p.id === s.staffId);
            return { task: s.task, start: s.start, end: s.end, personName: person?.name || 'Bilinmiyor', personColor: person?.color, unitName: '' };
        });
    } else {
        displayShifts = globalData.filter(s => {
            if (!s.BASLANGIC || !s.BITIS) return false;
            const startMin = timeToMin(s.BASLANGIC);
            const endMin = timeToMin(s.BITIS);
            return currentMin >= startMin && currentMin < endMin;
        }).map(s => ({ task: s.GOREV, start: s.BASLANGIC, end: s.BITIS, personName: s.AD_SOYAD, personColor: s.RENK, unitName: s.BIRIM }));
    }

    const groupedByUnit = {};
    displayShifts.forEach(shift => {
        const unit = shift.unitName || 'Bu Birim';
        if (!groupedByUnit[unit]) groupedByUnit[unit] = [];
        groupedByUnit[unit].push(shift);
    });

    // --- FITNESS KULLANICISI ÖZEL GÖRÜNÜMÜ ---
    if (isFitnessUser && mode === 'global') {
        const technoGymShifts = globalData.filter(s => s.BIRIM === 'Technogym Fitness' && !['YILLIK', 'IDARI', 'HAFTALIK', 'RAPOR'].includes(s.ETIKET) && s.BASLANGIC && s.BITIS && currentMin >= timeToMin(s.BASLANGIC) && currentMin < timeToMin(s.BITIS));
        const genelFitnessShifts = globalData.filter(s => s.BIRIM === 'Genel Fitness' && !['YILLIK', 'IDARI', 'HAFTALIK', 'RAPOR'].includes(s.ETIKET) && s.BASLANGIC && s.BITIS && currentMin >= timeToMin(s.BASLANGIC) && currentMin < timeToMin(s.BITIS));
        const totalFitnessActive = technoGymShifts.length + genelFitnessShifts.length;

        return (
            <ExpandablePanel 
                title={`CANLI İZLEME - FITNESS (${dayNames[currentDayIdx]} ${dotTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)})`}
                iconBg="bg-green-500"
                count={`${totalFitnessActive} Aktif`}
            >
                <div className="flex justify-end mb-2 -mt-1 relative z-20">
                    <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-600/50">
                        <button onClick={(e) => { e.stopPropagation(); setMode('local'); }} className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${mode === 'local' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>Bu Birim</button>
                        <button onClick={(e) => { e.stopPropagation(); setMode('global'); }} className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${mode === 'global' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Tüm Fitness</button>
                    </div>
                </div>

                {loading ? <div className="text-slate-400 text-xs text-center py-4">Yükleniyor...</div> : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {/* SOL: TECHNOGYM */}
                        <div className="flex flex-col">
                            <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-1.5 mb-2 flex items-center justify-between">
                                <span className="text-blue-200 text-[11px] font-bold uppercase tracking-wide">🏋️ TECHNOGYM</span>
                                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">{technoGymShifts.length}</span>
                            </div>
                            <div className="space-y-2">
                                {technoGymShifts.map((shift, idx) => (
                                    <div key={idx} className="bg-slate-800/80 hover:bg-slate-800 rounded-lg p-2 border border-slate-700/50 hover:border-blue-500 transition flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px]" style={{ backgroundColor: shift.RENK }}>{shift.AD_SOYAD.charAt(0)}</div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-slate-200 text-[10px] font-bold truncate">{shift.AD_SOYAD}</div>
                                            <div className="text-slate-400 text-[9px]">{shift.GOREV}</div>
                                        </div>
                                        <div className="text-blue-300 text-[9px] font-mono bg-slate-900/50 px-1.5 py-0.5 rounded">{dotTime(shift.BASLANGIC)}-{dotTime(shift.BITIS)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* SAĞ: GENEL FITNESS */}
                        <div className="flex flex-col">
                            <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-lg px-3 py-1.5 mb-2 flex items-center justify-between">
                                <span className="text-emerald-200 text-[11px] font-bold uppercase tracking-wide">💪 GENEL FITNESS</span>
                                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">{genelFitnessShifts.length}</span>
                            </div>
                            <div className="space-y-2">
                                {genelFitnessShifts.map((shift, idx) => (
                                    <div key={idx} className="bg-slate-800/80 hover:bg-slate-800 rounded-lg p-2 border border-slate-700/50 hover:border-emerald-500 transition flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px]" style={{ backgroundColor: shift.RENK }}>{shift.AD_SOYAD.charAt(0)}</div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-slate-200 text-[10px] font-bold truncate">{shift.AD_SOYAD}</div>
                                            <div className="text-slate-400 text-[9px]">{shift.GOREV}</div>
                                        </div>
                                        <div className="text-emerald-300 text-[9px] font-mono bg-slate-900/50 px-1.5 py-0.5 rounded">{dotTime(shift.BASLANGIC)}-{dotTime(shift.BITIS)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </ExpandablePanel>
        );
    }

    // --- NORMAL KULLANICI GÖRÜNÜMÜ ---
    return (
        <ExpandablePanel 
            title={`CANLI İZLEME • ${dayNames[currentDayIdx]} ${dotTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)}`}
            iconBg="bg-green-500"
            count={displayShifts.length > 0 ? `${displayShifts.length} Aktif` : 'Yok'}
        >
            {(isAdmin || isManager || isFitnessUser) && (
                <div className="flex justify-end mb-2 -mt-1 relative z-20">
                    <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-600/50">
                        <button onClick={(e) => { e.stopPropagation(); setMode('local'); }} className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${mode === 'local' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>Bu Birim</button>
                        <button onClick={(e) => { e.stopPropagation(); setMode('global'); }} className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${mode === 'global' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>{isFitnessUser ? 'Tüm Fitness' : 'Tüm Merkez'}</button>
                    </div>
                </div>
            )}

            {loading ? <div className="text-slate-400 text-xs text-center py-4">Yükleniyor...</div> : displayShifts.length === 0 ? <div className="flex items-center justify-center text-slate-500 text-xs italic py-4">Şu an aktif personel yok</div> : (
                <div className="space-y-3">
                    {Object.keys(groupedByUnit).sort().map(unitName => (
                        <div key={unitName}>
                            {mode === 'global' && <div className="text-[10px] font-bold text-slate-500 mb-1 pl-1 uppercase tracking-widest">{unitName}</div>}
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                {groupedByUnit[unitName].map((shift, idx) => (
                                    <div key={idx} className="bg-slate-800/80 hover:bg-slate-800 rounded-lg p-2 border border-slate-700/50 hover:border-slate-600 transition flex items-center gap-2 group">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: shift.personColor }}>
                                            {shift.personName.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-slate-200 text-[10px] font-bold truncate leading-tight">{shift.personName}</div>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <span className="text-slate-400 text-[9px] truncate max-w-[60%]">{shift.task || 'Görevli'}</span>
                                                <span className="text-green-400 text-[9px] font-mono bg-green-900/20 px-1 rounded">{dotTime(shift.start)}-{dotTime(shift.end)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ExpandablePanel>
    );
}

// --- Weekly Leave Bileşeni ---
function WeeklyLeave({ shifts, staff, weekStart, units, currentUnit, currentUser }) {
    const dayNamesShort = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    
    // KISALTMALAR İPTAL - TAM İSİMLER
    const LEAVE_TYPES_MAP = { 
        'YILLIK': { label: 'Yıllık İzin', color: '#dc2626' }, 
        'IDARI': { label: 'İdari İzin', color: '#ea580c' }, 
        'HAFTALIK': { label: 'Haftalık Tatil', color: '#9333ea' }, 
        'RAPOR': { label: 'Rapor', color: '#16a34a' } 
    };
    
    const isFitnessUser = currentUser?.username === 'fitness';

    const weeklyLeaves = shifts.filter(s => ['YILLIK', 'IDARI', 'HAFTALIK', 'RAPOR'].includes(s.tag));
    const leavesByPerson = {};
    
    weeklyLeaves.forEach(leave => {
        const person = staff.find(p => p.id === leave.staffId);
        if (!person) return;
        const unitName = person.unitName || currentUnit?.name || 'Bu Birim';

        if (!leavesByPerson[leave.staffId]) { 
            leavesByPerson[leave.staffId] = { 
                personName: person.name, 
                personColor: person.color, 
                unitName: unitName, 
                leaves: [] 
            }; 
        }
        const leaveInfo = LEAVE_TYPES_MAP[leave.tag];
        leavesByPerson[leave.staffId].leaves.push({ 
            day: leave.day, 
            dayName: dayNamesShort[leave.day], 
            tag: leave.tag, 
            label: leaveInfo?.label || 'İzin', 
            color: leaveInfo?.color || '#666', 
            start: leave.start, 
            end: leave.end 
        });
    });

    const peopleWithLeaves = Object.values(leavesByPerson);
    
    peopleWithLeaves.forEach(person => {
        const grouped = {};
        person.leaves.forEach(leave => {
            if (!grouped[leave.tag]) { grouped[leave.tag] = { tag: leave.tag, label: leave.label, color: leave.color, days: [], count: 0 }; }
            grouped[leave.tag].days.push(leave.dayName);
            grouped[leave.tag].count++;
            if (leave.tag === 'IDARI' && leave.start && leave.end) { grouped[leave.tag].time = `${dotTime(leave.start)}-${dotTime(leave.end)}`; }
        });
        person.groupedLeaves = Object.values(grouped);
    });

    const groupedByUnit = {};
    peopleWithLeaves.forEach(person => {
        const unit = person.unitName;
        if (!groupedByUnit[unit]) groupedByUnit[unit] = [];
        groupedByUnit[unit].push(person);
    });

    // --- ORTAK KART TASARIMI ---
    const renderPersonCard = (person, idx) => (
        <div key={idx} className="bg-slate-800 hover:bg-slate-750 rounded-lg p-2 transition border border-slate-700/50 hover:border-slate-600 flex flex-col gap-1.5 h-full">
            <div className="flex items-center gap-2 border-b border-slate-700/50 pb-1.5 mb-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[9px] flex-shrink-0" style={{ backgroundColor: person.personColor }}>{person.personName.charAt(0)}</div>
                <div className="text-white text-[10px] font-bold truncate leading-tight flex-1">{person.personName}</div>
                {/* GÜN SAYISI SAĞA YASLI */}
                <div className="text-[9px] font-bold text-slate-400 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700/50 whitespace-nowrap">{person.leaves.length} Gün</div>
            </div>
            <div className="flex flex-col gap-1">
                {person.groupedLeaves.map((group, gidx) => (
                <div key={gidx} className="flex items-center gap-1.5 text-[9px] bg-slate-900/40 p-1 rounded border-l-2" style={{ borderColor: group.color }}>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                            <span className="font-bold truncate" style={{ color: group.color }}>{group.label}</span>
                            {group.count > 1 && <span className="text-slate-500 font-mono text-[8px]">x{group.count}</span>}
                        </div>
                        {/* BOŞLUKLU PARANTEZ */}
                        <div className="text-slate-400 text-[8px] truncate mt-0.5 leading-tight">
                             <span className="ml-1">({group.days.join(', ')})</span>
                        </div>
                        {group.time && <div className="text-[8px] mt-0.5 font-mono text-orange-300/80">{group.time}</div>}
                    </div>
                </div>
                ))}
            </div>
        </div>
    );

    // --- FITNESS ÖZEL GÖRÜNÜM (ÇİFT SÜTUN) ---
    if (isFitnessUser) {
        const technoGymLeaves = peopleWithLeaves.filter(p => p.unitName === 'Technogym Fitness');
        const genelFitnessLeaves = peopleWithLeaves.filter(p => p.unitName === 'Genel Fitness');
        const totalLeaves = technoGymLeaves.length + genelFitnessLeaves.length;

        return (
            <ExpandablePanel title="BU HAFTA İZİNLİLER - FITNESS" iconBg="bg-orange-500" count={`${totalLeaves} Kişi`}>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="flex flex-col">
                         <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-1.5 mb-2 flex items-center justify-between">
                            <span className="text-blue-200 text-[11px] font-bold uppercase tracking-wide">🏋️ TECHNOGYM</span>
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">{technoGymLeaves.length}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">{technoGymLeaves.map((person, idx) => renderPersonCard(person, idx))}</div>
                    </div>
                     <div className="flex flex-col">
                         <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-lg px-3 py-1.5 mb-2 flex items-center justify-between">
                            <span className="text-emerald-200 text-[11px] font-bold uppercase tracking-wide">💪 GENEL FITNESS</span>
                            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">{genelFitnessLeaves.length}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">{genelFitnessLeaves.map((person, idx) => renderPersonCard(person, idx))}</div>
                    </div>
                 </div>
            </ExpandablePanel>
        );
    }

    // --- NORMAL GÖRÜNÜM ---
    return (
        <ExpandablePanel title="BU HAFTA İZİNLİLER" iconBg="bg-orange-500" count={peopleWithLeaves.length > 0 ? `${peopleWithLeaves.length} Kişi` : 'Yok'}>
            {peopleWithLeaves.length === 0 ? <div className="flex items-center justify-center text-slate-500 text-xs italic py-4">Bu hafta izinli personel yok</div> : (
            <div className="space-y-3">
                {Object.keys(groupedByUnit).sort().map(unitName => (
                <div key={unitName}>
                    {/* Grid Yapısı: Mobilde 2 sütun, Masaüstünde 4 sütun */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {groupedByUnit[unitName].map((person, idx) => renderPersonCard(person, idx))}
                    </div>
                </div>
                ))}
            </div>
            )}
        </ExpandablePanel>
    );
}