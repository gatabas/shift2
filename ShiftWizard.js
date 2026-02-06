/* public/js/modals/ShiftWizard.js - Toplu Shift Ekleme Sihirbazi */
/* Global bagimliliklar: dayNames, timeToMin, getTaskOptions, TimeInput, TemplateManager */

const ShiftWizard = ({ isOpen, onClose, targetName, form, setForm, templates, showTemplateManager, setShowTemplateManager, newTemplate, setNewTemplate, editingTemplate, setEditingTemplate, onAddTemplate, onUpdateTemplate, onDeleteTemplate, onApply, currentUnit, onReorderTemplates, tasks }) => {
    if (!isOpen) return null;

    // Gunluk Izin kontrolu - gorev turu degistiginde saatleri ayarla
    const handleTaskChange = (idx, newTask) => {
        const newShifts = [...form.shifts];
        newShifts[idx].task = newTask;

        // Gunluk Izin secildiginde: saatleri, kapsayan shift'in saatlerine gore ayarla
        const isGunlukIzin = newTask === 'Günlük İzin' || newTask === 'Günlük izin';
        if (isGunlukIzin) {
            // Bir onceki gorevin bitis saatini baslangic olarak al
            const prevShift = idx > 0 ? newShifts[idx - 1] : null;
            const nextShift = idx < newShifts.length - 1 ? newShifts[idx + 1] : null;
            if (prevShift && prevShift.end) {
                newShifts[idx].start = prevShift.end;
            }
            if (nextShift && nextShift.start) {
                newShifts[idx].end = nextShift.start;
            }
        }
        setForm({ ...form, shifts: newShifts });
    };

    // Baslangic saati degistiginde: onceki gorevin bitisinden once olamaz (Gunluk Izin harici)
    const handleStartChange = (idx, v) => {
        const newShifts = [...form.shifts];
        const isGunluk = newShifts[idx].task === 'Günlük İzin' || newShifts[idx].task === 'Günlük izin';
        if (idx > 0 && !isGunluk) {
            const prevEnd = newShifts[idx - 1].end;
            if (prevEnd && prevEnd.length === 5 && v && v.length === 5 && timeToMin(v) < timeToMin(prevEnd)) {
                v = prevEnd;
            }
        }
        newShifts[idx].start = v;
        setForm({ ...form, shifts: newShifts });
    };

    // Yeni gorev ekleme: baslangic saatini otomatik doldur (Gunluk Izin'den sonra otomatik doldurma)
    const handleAddShift = () => {
        const lastShift = form.shifts[form.shifts.length - 1];
        const lastIsGunluk = lastShift && (lastShift.task === 'Günlük İzin' || lastShift.task === 'Günlük izin');
        const autoStart = (!lastIsGunluk && lastShift && lastShift.end && lastShift.end.length === 5) ? lastShift.end : '';
        setForm({ ...form, shifts: [...form.shifts, { start: autoStart, end: '', task: currentUnit?.name || '' }] });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-2"> <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> <div> <h3 className="font-bold text-lg leading-none">Toplu Shift Sihirbazı</h3> <p className="text-[10px] opacity-80 font-normal mt-0.5">Personel: {targetName}</p> </div> </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-bold">×</button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="mb-5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">GÜNLERİ SEÇİN</label>
                        <div className="flex flex-wrap gap-2">
                            {dayNames.map((d, i) => {
                                const isSelected = form.days.includes(i);
                                return ( <button key={i} onClick={() => { const newDays = isSelected ? form.days.filter(day => day !== i) : [...form.days, i].sort(); setForm({ ...form, days: newDays }); }} className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition ${isSelected ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white'}`}> {d.slice(0, 3)} </button> )
                            })}
                        </div>
                        <div className="mt-2 flex gap-2">
                            <button onClick={() => setForm({ ...form, days: [0, 1, 2, 3, 4] })} className="text-[10px] text-purple-600 hover:underline font-bold">Hafta İçi</button>
                            <button onClick={() => setForm({ ...form, days: [5, 6] })} className="text-[10px] text-purple-600 hover:underline font-bold">Hafta Sonu</button>
                            <button onClick={() => setForm({ ...form, days: [0, 1, 2, 3, 4, 5, 6] })} className="text-[10px] text-purple-600 hover:underline font-bold">Tümü</button>
                        </div>
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
                             const templateShift = { start: t.BASLANGIC, end: t.BITIS, task: (t.GOREV && t.GOREV.trim() !== "") ? t.GOREV : (currentUnit?.name || '') };
                             let currentShifts = [...form.shifts];
                             if (currentShifts.length === 1 && currentShifts[0].start === '00:00' && currentShifts[0].end === '00:00') { currentShifts = [templateShift]; } else { currentShifts.push(templateShift); }
                             setForm({ ...form, shifts: currentShifts });
                        }}
                    />

                    <div className="mb-4 space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">GÖREVLER VE SAATLER</label>
                        {form.shifts.map((shift, idx) => (
                            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative group animate-in fade-in slide-in-from-left-2">
                                <button onClick={() => { const newShifts = [...form.shifts]; newShifts.splice(idx, 1); setForm({ ...form, shifts: newShifts }); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition opacity-0 group-hover:opacity-100 z-10" title="Görevi Sil"> <span className="text-xs font-bold">×</span> </button>
                                <div className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-12 mb-2">
                                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Görev</label>
                                        <select className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white" value={shift.task} onChange={e => handleTaskChange(idx, e.target.value)}> {getTaskOptions(currentUnit?.name).map(opt => <option key={opt} value={opt}>{opt}</option>)} </select>
                                    </div>
                                    <div className="col-span-6"> <label className="text-xs font-bold text-slate-500 block mb-2">Başlangıç</label> <TimeInput inputId={`wizard-start-${idx}`} value={shift.start} onChange={v => handleStartChange(idx, v)} onComplete={() => document.getElementById(`wizard-end-${idx}`)?.focus()} placeholder="00:00" /> </div>
                                    <div className="col-span-6"> <label className="text-xs font-bold text-slate-500 block mb-2">Bitiş</label> <TimeInput inputId={`wizard-end-${idx}`} value={shift.end} onChange={v => { const newShifts = [...form.shifts]; newShifts[idx].end = v; setForm({ ...form, shifts: newShifts }); }} placeholder="00:00" /> </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={handleAddShift} className="w-full py-2 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 font-bold text-xs hover:bg-purple-50 hover:border-purple-400 transition flex items-center justify-center gap-1"> <span className="text-lg">+</span> Başka Görev Ekle </button>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
                    <button onClick={onApply} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-purple-200 transition transform active:scale-95 flex items-center justify-center gap-2"> <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> <span>Shiftleri Uygula ({form.days.length} Gün)</span> </button>
                </div>
            </div>
        </div>
    );
};
