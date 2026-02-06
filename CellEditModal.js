/* public/js/modals/CellEditModal.js - Ana Hucre Duzenleme Modali */
/* Global bagimliliklar: dayNames, LEAVE_TYPES, TimeInput, getTaskOptions, TemplateManager */

const CellEditModal = ({ isOpen, onClose, cellEdit, setCellEdit, staffName, onSave, templates, showTemplateManager, setShowTemplateManager, newTemplate, setNewTemplate, editingTemplate, setEditingTemplate, onAddTemplate, onUpdateTemplate, onDeleteTemplate, currentUnit, tasks, currentUser, leaveStartDate, setLeaveStartDate, leaveEndDate, setLeaveEndDate, leaveStartTime, setLeaveStartTime, leaveEndTime, setLeaveEndTime, minDateLimit, toast, timeToMin, onReorderTemplates }) => {
    if (!isOpen || !cellEdit) return null;

    // Teknik Servis yetki kontrolu
    const isTeknikServis = currentUser?.username === 'teknikservis';

    // Gorev turu degistiginde - Gunluk Izin mantigi
    const handleTaskChange = (idx, newTask) => {
        const ns = [...cellEdit.shifts];
        ns[idx].task = newTask;

        const isGunlukIzin = newTask === 'Günlük İzin' || newTask === 'Günlük izin';
        if (isGunlukIzin) {
            // Bir onceki gorevin bitisini baslangic, bir sonrakinin baslangicini bitis yap
            const prevShift = idx > 0 ? ns[idx - 1] : null;
            const nextShift = idx < ns.length - 1 ? ns[idx + 1] : null;
            if (prevShift && prevShift.end) {
                ns[idx].start = prevShift.end;
            }
            if (nextShift && nextShift.start) {
                ns[idx].end = nextShift.start;
            }
        }
        setCellEdit({ ...cellEdit, shifts: ns });
    };

    // Baslangic saati degisikligi - onceki gorevin bitisinden once olamaz (Gunluk Izin harici)
    const handleStartChange = (idx, v) => {
        const ns = [...cellEdit.shifts];
        const isGunluk = ns[idx].task === 'Günlük İzin' || ns[idx].task === 'Günlük izin';
        if (idx > 0 && !isGunluk) {
            const prevEnd = ns[idx - 1].end;
            if (prevEnd && prevEnd.length === 5 && v && v.length === 5 && timeToMin(v) < timeToMin(prevEnd)) {
                v = prevEnd;
            }
        }
        ns[idx].start = v;
        setCellEdit({ ...cellEdit, shifts: ns });
    };

    // Yeni gorev ekleme - onceki gorevin bitisini baslangic olarak ata (Gunluk Izin'den sonra otomatik doldurma yok)
    const handleAddShift = (e) => {
        const lastShift = cellEdit.shifts[cellEdit.shifts.length - 1];
        if (!lastShift.end || lastShift.end.length !== 5) { toast.show("Önceki shift'in bitiş saatini girin!", true); return; }
        const lastIsGunluk = lastShift.task === 'Günlük İzin' || lastShift.task === 'Günlük izin';
        const autoStart = lastIsGunluk ? '' : lastShift.end;
        setCellEdit({ ...cellEdit, shifts: [...cellEdit.shifts, { task: `${currentUnit?.name || ''}`, start: autoStart, end: '' }] });
        setTimeout(() => {
            const button = e.target.closest('button');
            if (button) { const modal = button.closest('.overflow-hidden'); if (modal) { const container = modal.querySelector('.overflow-y-auto'); if (container) { container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' }); } } }
        }, 100);
    };

    // Gorev listesini guvenli render etme
    const renderTaskOptions = () => {
        if (tasks && Array.isArray(tasks)) {
            return tasks.map((t, i) => {
                const val = typeof t === 'object' ? (t.name || t.GOREV || '') : t;
                return <option key={i} value={val}>{val}</option>;
            });
        }
        return null;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10 pr-12">
                        <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-1">{dayNames[cellEdit.day]}</div>
                        <div className="text-xl font-bold leading-tight">{staffName}</div>
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition text-white text-xl font-bold z-50">✕</button>
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                    <div className="mb-5">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">İzin Türü Seçimi</div>
                        <div className="grid grid-cols-2 gap-2">
                            {LEAVE_TYPES.map(type => (
                                <label key={type.value} className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition group ${cellEdit.tag === type.value ? (type.color === 'red' ? 'border-red-300 bg-red-50' : type.color === 'orange' ? 'border-orange-300 bg-orange-50' : type.color === 'purple' ? 'border-purple-300 bg-purple-50' : 'border-green-300 bg-green-50') : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                                    <input type="radio" name="leaveType" className="sr-only" checked={cellEdit.tag === type.value} onChange={() => setCellEdit(prev => ({ ...prev, tag: type.value, shifts: [] }))} />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${cellEdit.tag === type.value ? (type.color === 'red' ? 'border-red-500 bg-red-500' : type.color === 'orange' ? 'border-orange-500 bg-orange-500' : type.color === 'purple' ? 'border-purple-500 bg-purple-500' : 'border-green-500 bg-green-50') : 'border-slate-300 bg-white'}`}> {cellEdit.tag === type.value && (<div className="w-2 h-2 bg-white rounded-full"></div>)} </div>
                                    <div className="flex-1"> <div className={`font-bold text-sm ${cellEdit.tag === type.value ? (type.color === 'red' ? 'text-red-700' : type.color === 'orange' ? 'text-orange-700' : type.color === 'purple' ? 'text-purple-700' : 'text-green-700') : 'text-slate-600'}`}> {type.label} </div> </div>
                                </label>
                            ))}
                        </div>
                        <label className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition mt-2 ${!cellEdit.tag ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                            <input type="radio" name="leaveType" className="sr-only" checked={!cellEdit.tag} onChange={() => setCellEdit(prev => ({ ...prev, tag: '', shifts: prev.shifts.length > 0 ? prev.shifts : [{ task: `${currentUnit?.name || ''}`, start: '', end: '' }] }))} />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${!cellEdit.tag ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'}`}> {!cellEdit.tag && (<div className="w-2 h-2 bg-white rounded-full"></div>)} </div>
                            <div className="flex-1"> <div className={`font-bold text-sm ${!cellEdit.tag ? 'text-blue-700' : 'text-slate-600'}`}> Shift </div> </div>
                        </label>
                    </div>

                    {/* Izin Tarihleri */}
                    {cellEdit.tag && cellEdit.tag !== 'IDARI' && (
                        <div className={`rounded-2xl p-4 border-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300 ${cellEdit.tag === 'YILLIK' ? 'bg-red-50 border-red-100' : cellEdit.tag === 'HAFTALIK' ? 'bg-purple-50 border-purple-100' : 'bg-green-50 border-green-100'}`}>
                            <div className={`text-center text-xs font-bold uppercase tracking-wide mb-3 ${cellEdit.tag === 'YILLIK' ? 'text-red-600' : cellEdit.tag === 'HAFTALIK' ? 'text-purple-600' : 'text-green-600'}`}> {LEAVE_TYPES.find(t => t.value === cellEdit.tag)?.label} Tarihleri </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div> <label className={`block text-xs font-semibold mb-2 ${cellEdit.tag === 'YILLIK' ? 'text-red-700' : cellEdit.tag === 'HAFTALIK' ? 'text-purple-700' : 'text-green-700'}`}>Başlangıç</label> <input type="date" className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm bg-white focus:outline-none focus:ring-2 transition ${cellEdit.tag === 'YILLIK' ? 'border-red-200 focus:border-red-500 focus:ring-red-200' : cellEdit.tag === 'HAFTALIK' ? 'border-purple-200 focus:border-purple-500 focus:ring-purple-200' : 'border-green-200 focus:border-green-500 focus:ring-green-200'}`} value={leaveStartDate} min={minDateLimit} onChange={e => { setLeaveStartDate(e.target.value); if (e.target.value > leaveEndDate) setLeaveEndDate(e.target.value); }} /> </div>
                                <div> <label className={`block text-xs font-semibold mb-2 ${cellEdit.tag === 'YILLIK' ? 'text-red-700' : cellEdit.tag === 'HAFTALIK' ? 'text-purple-700' : 'text-green-700'}`}>Bitiş</label> <input type="date" className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm bg-white focus:outline-none focus:ring-2 transition ${cellEdit.tag === 'YILLIK' ? 'border-red-200 focus:border-red-500 focus:ring-red-200' : cellEdit.tag === 'HAFTALIK' ? 'border-purple-200 focus:border-purple-500 focus:ring-purple-200' : 'border-green-200 focus:border-green-500 focus:ring-green-200'}`} value={leaveEndDate} min={leaveStartDate} onChange={e => setLeaveEndDate(e.target.value)} /> </div>
                            </div>
                        </div>
                    )}

                    {/* Idari Izin */}
                    {cellEdit.tag === 'IDARI' && (
                        <div className="rounded-2xl p-4 border-2 mb-4 bg-orange-50 border-orange-100 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="text-center text-xs font-bold uppercase tracking-wide text-orange-600 mb-3"> {dayNames[cellEdit.day]} - İdari İzin Saatleri </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div> <label className="block text-xs font-semibold text-orange-700 mb-2">Başlangıç Saati</label> <input type="time" className="w-full px-3 py-2.5 rounded-xl border-2 text-sm" value={leaveStartTime} onChange={(e) => setLeaveStartTime(e.target.value)} /> </div>
                                <div> <label className="block text-xs font-semibold text-orange-700 mb-2">Bitiş Saati</label> <input type="time" className="w-full px-3 py-2.5 rounded-xl border-2 text-sm" value={leaveEndTime} onChange={(e) => setLeaveEndTime(e.target.value)} /> </div>
                            </div>
                        </div>
                    )}

                    {/* SHIFT GIRISI */}
                    {!cellEdit.tag && (
                        <>
                            <div className="space-y-3">
                                {cellEdit.shifts.map((s, idx) => {
                                    return (
                                        <div key={idx} className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-4 border-2 border-blue-100 relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {cellEdit.shifts.length > 1 && (<button onClick={() => { const ns = [...cellEdit.shifts]; ns.splice(idx, 1); setCellEdit({ ...cellEdit, shifts: ns }) }} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 hover:scale-110 transition transform opacity-0 group-hover:opacity-100"> <span className="text-sm">×</span> </button>)}
                                            <div className="absolute -left-2 -top-2 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md"> {idx + 1} </div>

                                            <div className="space-y-3 mt-2">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Görev Türü</label>
                                                    <select
                                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white transition appearance-none cursor-pointer"
                                                        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%23475569%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', paddingRight: '2.5rem' }}
                                                        value={s.task || ''}
                                                        onChange={(e) => handleTaskChange(idx, e.target.value)}
                                                    >
                                                        <option value="">Seçiniz</option>
                                                        {renderTaskOptions()}
                                                    </select>
                                                </div>

                                                <TemplateManager
                                                    show={showTemplateManager} onToggle={() => setShowTemplateManager(!showTemplateManager)}
                                                    templates={templates} newTemplate={newTemplate} setNewTemplate={setNewTemplate}
                                                    editingTemplate={editingTemplate} setEditingTemplate={setEditingTemplate}
                                                    onAdd={onAddTemplate} onUpdate={onUpdateTemplate} onDelete={onDeleteTemplate}
                                                    currentUnit={currentUnit}
                                                    tasks={tasks}
                                                    onReorder={onReorderTemplates}
                                                    onApply={(t) => {
                                                        const ns = [...cellEdit.shifts];
                                                        ns[idx].start = t.BASLANGIC;
                                                        ns[idx].end = t.BITIS;
                                                        if (t.GOREV && t.GOREV.trim() !== "") { ns[idx].task = t.GOREV; }
                                                        setCellEdit({ ...cellEdit, shifts: ns });
                                                    }}
                                                />

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Giriş</label>
                                                        <TimeInput
                                                            inputId={`shift-start-${idx}`}
                                                            value={s.start || ""}
                                                            onChange={(v) => handleStartChange(idx, v)}
                                                            onComplete={() => document.getElementById(`shift-end-${idx}`)?.focus()}
                                                            placeholder="00:00"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Çıkış</label>
                                                        <TimeInput
                                                            inputId={`shift-end-${idx}`}
                                                            value={s.end || ""}
                                                            onChange={(v) => { const ns = [...cellEdit.shifts]; ns[idx].end = v; setCellEdit({ ...cellEdit, shifts: ns }); }}
                                                            placeholder="00:00"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button onClick={handleAddShift} className="w-full py-4 border-3 border-dashed border-blue-300 rounded-2xl text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition font-bold text-sm flex items-center justify-center gap-2 group mt-4"> <span className="text-xl group-hover:scale-110 transition-transform">+</span> <span>Yeni Görev Ekle</span> </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-5 py-4 border-t-2 border-slate-100 flex gap-3">
                    <button onClick={() => { onSave({ staffId: cellEdit.staffId, day: cellEdit.day, shifts: [], tag: '', leaveStartTime: '', leaveEndTime: '' }) }} className="px-5 py-3 rounded-xl text-sm font-bold text-red-600 bg-white border-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition transform active:scale-95"> 🗑️ Temizle </button>
                    <button onClick={() => onSave({ ...cellEdit, leaveStartTime, leaveEndTime })} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-3 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 transition transform active:scale-95"> ✓ Kaydet </button>
                </div>
            </div>
        </div>
    );
};
