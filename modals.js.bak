/* public/js/modals.js - Tüm Modal Pencereler */

// --- E-posta Modalı ---
const EmailModal = ({ isOpen, onClose, form, setForm, onSend, sending }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center border-b border-blue-500"> 
                    <h3 className="text-white font-bold text-lg">Shift Paylaş (E-posta)</h3> 
                    <button onClick={onClose} className="text-blue-100 hover:text-white transition text-2xl">×</button> 
                </div>
                <div className="p-6 space-y-4"> 
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Alıcılar</label>
                        <input value={form.recipients} onChange={e => setForm(prev => ({ ...prev, recipients: e.target.value }))} className="w-full border rounded-xl px-3 py-2.5 body-small focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ornek@pau.edu.tr" />
                    </div> 
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Konu</label>
                        <input value={form.subject} onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))} className="w-full border rounded-xl px-3 py-2.5 body-small focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div> 
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Not</label>
                        <textarea value={form.note} onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))} className="w-full border rounded-xl px-3 py-2.5 body-small focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"></textarea>
                    </div> 
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer" onClick={() => setForm(prev => ({ ...prev, includeExcel: !prev.includeExcel }))}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${form.includeExcel ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300' }`}>{form.includeExcel && '✓'}</div>
                        <div className="text-sm font-semibold text-slate-700 select-none">Excel Dosyasını Ekle</div>
                    </div> 
                    <button onClick={onSend} disabled={sending} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-200">{sending ? 'Gönderiliyor...' : 'Gönder'}</button> 
                </div>
            </div>
        </div>
    );
};

// --- Arşiv Modalı ---
const ArchiveModal = ({ isOpen, onClose, view, setView, list, isAdmin, createArchive, deleteArchive, viewArchive }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 lg:p-4" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${view ? 'max-w-[98vw]' : 'max-w-2xl'} overflow-hidden flex flex-col h-[90vh] transition-all duration-300`} onClick={e => e.stopPropagation()}>
                <div className="bg-blue-600 px-4 py-3 flex justify-between items-center border-b border-blue-500 shrink-0">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2 truncate">
                        {view ? (<><span className="opacity-70 font-normal text-sm hidden sm:inline">{view.week}</span><span>Arşiv Detayı</span></>) : 'Shift Arşivi'}
                    </h3>
                    <button onClick={onClose} className="text-blue-100 hover:text-white transition text-2xl px-2">×</button>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 relative">
                    {!view ? (
                        <div className="p-4 lg:p-6 overflow-y-auto h-full bg-white">
                            {isAdmin && ( <button onClick={createArchive} className="w-full bg-blue-50 border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-100 text-blue-700 py-4 rounded-xl font-bold mb-6 transition flex items-center justify-center gap-2"> <span className="text-xl">+</span> Bu Haftayı Arşivle </button> )}
                            <div className="space-y-2">
                                {list.length === 0 ? <div className="text-center text-slate-400 py-4">Arşiv yok.</div> : list.map(item => (
                                    <div key={item.ID} onClick={() => viewArchive(item.ID)} className="p-4 border rounded-xl hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition flex justify-between items-center group bg-white shadow-sm">
                                        <div><div className="font-bold text-slate-800 text-sm lg:text-base">{item.BASLIK}</div><div className="text-xs text-slate-500 mt-1">{new Date(item.OLUSTURMA_TARIHI).toLocaleString('tr-TR')}</div></div>
                                        <div className="flex items-center gap-3">
                                            {isAdmin && ( <button onClick={(e) => deleteArchive(item.ID, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition opacity-100 lg:opacity-0 lg:group-hover:opacity-100" title="Sil"> <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> </button> )}
                                            <div className="text-slate-300 group-hover:text-blue-600 transition">➜</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full w-full">
                            <div className="bg-white border-b border-slate-200 p-2 flex justify-between items-center shrink-0 sticky top-0 z-50 shadow-sm">
                                <button onClick={() => setView(null)} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"> <span>◀</span> <span className="hidden sm:inline">Listeye Dön</span><span className="sm:hidden">Geri</span> </button>
                                {view.content?.note && (<div className="text-xs text-slate-500 italic max-w-[200px] lg:max-w-md truncate"> Not: {view.content.note} </div>)}
                            </div>
                            <div className="flex-1 overflow-auto w-full relative bg-slate-50">
                                {/* Tablo içeriği dinamik oluşturulur */}
                                <div className="text-center p-10 text-slate-400">Arşiv görüntüleme modülü</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- PDKS Modalı ---
const PDKSModal = ({ isOpen, onClose, data, loading }) => {
    if (!isOpen) return null;
    const getPDKSColor = (status) => ({ 'on-time': 'bg-green-50 border-green-300 text-green-800', 'late-minor': 'bg-yellow-50 border-yellow-300 text-yellow-800', 'late-moderate': 'bg-orange-50 border-orange-300 text-orange-800', 'late-major': 'bg-red-50 border-red-300 text-red-800', 'early': 'bg-blue-50 border-blue-300 text-blue-800', 'missing': 'bg-gray-50 border-gray-300 text-gray-800' }[status] || 'bg-white border-slate-200');
    const getPDKSIcon = (status) => ({ 'on-time': '✅', 'late-minor': '⚠️', 'late-moderate': '🟠', 'late-major': '🔴', 'early': '🔵', 'missing': '❌' }[status] || '❓');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3"> <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> <div><h3 className="text-white font-bold text-xl">PDKS Karşılaştırma</h3></div> </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-3xl font-bold">×</button>
                </div>
                {data && (
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 grid grid-cols-2 md:grid-cols-5 gap-3 border-b shrink-0">
                        <div className="bg-white rounded-xl p-3 text-center shadow-sm border"><div className="text-2xl font-black text-slate-700">{data.summary.total}</div><div className="text-xs text-slate-500 font-bold">TOPLAM</div></div>
                        <div className="bg-green-50 border-green-200 rounded-xl p-3 text-center shadow-sm border"><div className="text-2xl font-black text-green-700">✅ {data.summary.onTime}</div><div className="text-xs text-green-600 font-bold">ZAMANINDA</div></div>
                        <div className="bg-yellow-50 border-yellow-200 rounded-xl p-3 text-center shadow-sm border"><div className="text-2xl font-black text-yellow-700">⚠️ {data.summary.late}</div><div className="text-xs text-yellow-600 font-bold">GEÇ GELDİ</div></div>
                        <div className="bg-red-50 border-red-200 rounded-xl p-3 text-center shadow-sm border"><div className="text-2xl font-black text-red-700">🔴 {data.summary.missing}</div><div className="text-xs text-red-600 font-bold">GELMEDİ</div></div>
                        <div className="bg-blue-50 border-blue-200 rounded-xl p-3 text-center shadow-sm border"><div className="text-2xl font-black text-blue-700">🔵 {data.summary.early}</div><div className="text-xs text-blue-600 font-bold">ERKEN GELDİ</div></div>
                    </div>
                )}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? <div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-slate-500 font-bold">PDKS verileri yükleniyor...</p></div> : !data ? <div className="text-center text-slate-400 py-12"><p className="text-lg font-bold">Veri yüklenemedi</p></div> : (
                        <div className="space-y-4">
                            {[0, 1, 2, 3, 4, 5, 6].map(gunIndex => {
                                const gunData = data.data.filter(d => d.gun === gunIndex);
                                if (gunData.length === 0) return null;
                                return (
                                    <div key={gunIndex} className="border-2 border-slate-200 rounded-2xl overflow-hidden">
                                        <div className="bg-slate-800 text-white px-4 py-3 font-bold text-center">{dayNames[gunIndex]} - {gunData[0]?.tarih}</div>
                                        <div className="bg-white divide-y divide-slate-100">
                                            {gunData.map((item, idx) => (
                                                <div key={idx} className={`p-4 transition hover:bg-slate-50 ${getPDKSColor(item.status)} border-l-4`}>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="flex items-center gap-3"><div className="text-3xl">{getPDKSIcon(item.status)}</div><div><div className="font-bold text-sm">{item.personelAd}</div><div className="text-xs text-slate-500">{item.details.message}</div>{item.details.exitNote && <div className="text-xs text-orange-600 font-bold mt-1">📤 {item.details.exitNote}</div>}</div></div>
                                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3"><div className="text-xs font-bold text-blue-600 uppercase mb-2">📋 Planlanan</div><div className="flex items-center gap-2 text-sm"><span className="font-mono font-bold text-blue-900">{item.planned.start}</span><span className="text-blue-400">→</span><span className="font-mono font-bold text-blue-900">{item.planned.end}</span></div><div className="text-xs text-blue-700 mt-1 truncate">{item.planned.task}</div></div>
                                                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3"><div className="text-xs font-bold text-purple-600 uppercase mb-2">✓ Gerçekleşen (PDKS)</div>{item.actual.start ? (<div className="flex items-center gap-2 text-sm"><span className="font-mono font-bold text-purple-900">{item.actual.start}</span><span className="text-purple-400">→</span><span className="font-mono font-bold text-purple-900">{item.actual.end || '...'}</span></div>) : (<div className="text-sm text-red-600 font-bold">❌ Kayıt yok</div>)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="bg-slate-50 px-6 py-4 border-t flex justify-between items-center shrink-0">
                    <div className="text-xs text-slate-500"><span className="font-bold">Not:</span> PDKS verileri rektörlük sisteminden otomatik çekilmektedir.</div>
                    <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold transition">Kapat</button>
                </div>
            </div>
        </div>
    );
};

// --- Template Manager ---
const TemplateManager = ({ show, onToggle, templates, newTemplate, setNewTemplate, editingTemplate, setEditingTemplate, onAdd, onUpdate, onDelete, onApply, currentUnit, tasks, onReorder }) => {
    
    // Drag & Drop state
    const [dragIdx, setDragIdx] = React.useState(null);
    const [dragOverIdx, setDragOverIdx] = React.useState(null);
    const listRef = React.useRef(null);
    const touchRef = React.useRef({ active: false, idx: null, moved: false });

    const handleDragStart = (e, idx) => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e, idx) => { e.preventDefault(); if (dragOverIdx !== idx) setDragOverIdx(idx); };
    const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };
    const handleDrop = async (e, dropIdx) => {
        e.preventDefault();
        const fromIdx = dragIdx;
        setDragIdx(null); setDragOverIdx(null);
        if (fromIdx === null || fromIdx === dropIdx) return;
        const reordered = [...templates];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(dropIdx, 0, moved);
        try {
            await api(API.TEMPLATES_REORDER, { method: 'POST', body: JSON.stringify({ unit: currentUnit?.id || currentUnit?.name, orderedIds: reordered.map(t => t.ID) }) });
            if (typeof onReorder === 'function') onReorder();
        } catch (err) { console.error('Şablon sıralama hatası:', err); }
    };
    const handleTouchStart = (e, idx) => { touchRef.current = { active: true, idx, moved: false }; };
    const handleTouchMove = (e, idx) => {
        if (!touchRef.current.active) return;
        touchRef.current.moved = true;
        e.preventDefault();
        const touch = e.touches[0];
        const container = e.target.closest('[data-template-idx]')?.parentElement;
        if (container) {
            container.querySelectorAll('[data-template-idx]').forEach(item => {
                const rect = item.getBoundingClientRect();
                if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                    const overIdx = parseInt(item.getAttribute('data-template-idx'));
                    if (dragOverIdx !== overIdx) setDragOverIdx(overIdx);
                }
            });
        }
        if (dragIdx !== idx) setDragIdx(idx);
    };
    const handleTouchEnd = async (e) => {
        if (!touchRef.current.active || !touchRef.current.moved) { touchRef.current = { active: false, idx: null, moved: false }; setDragIdx(null); setDragOverIdx(null); return; }
        const fromIdx = touchRef.current.idx;
        const toIdx = dragOverIdx;
        touchRef.current = { active: false, idx: null, moved: false };
        setDragIdx(null); setDragOverIdx(null);
        if (fromIdx === null || toIdx === null || fromIdx === toIdx) return;
        const reordered = [...templates];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);
        try {
            await api(API.TEMPLATES_REORDER, { method: 'POST', body: JSON.stringify({ unit: currentUnit?.id || currentUnit?.name, orderedIds: reordered.map(t => t.ID) }) });
            if (typeof onReorder === 'function') onReorder();
        } catch (err) { console.error('Şablon sıralama hatası:', err); }
    };

    const renderTaskOptions = () => {
        if (tasks && Array.isArray(tasks)) {
            return tasks.map((t, i) => {
                const val = typeof t === 'object' ? (t.name || t.GOREV || '') : t;
                return <option key={i} value={val}>{val}</option>;
            });
        }
        if (typeof getTaskOptions === 'function' && currentUnit) {
            return getTaskOptions(currentUnit.name).map(opt => <option key={opt} value={opt}>{opt}</option>);
        }
        return null;
    };

    const dragProps = (tIdx) => ({
        draggable: true,
        'data-template-idx': tIdx,
        onDragStart: (e) => handleDragStart(e, tIdx),
        onDragOver: (e) => handleDragOver(e, tIdx),
        onDragEnd: handleDragEnd,
        onDrop: (e) => handleDrop(e, tIdx),
        onTouchStart: (e) => handleTouchStart(e, tIdx),
        onTouchMove: (e) => handleTouchMove(e, tIdx),
        onTouchEnd: handleTouchEnd,
    });

    return (
        <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hızlı Şablonlar</label>
                <button onClick={onToggle} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline">
                    {show ? 'Kapat' : '+ Düzenle / Ekle'}
                </button>
            </div>
            {show && (
                <div className="mb-3 p-2 bg-white border border-blue-100 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1">
                    <div className="space-y-2 mb-2">
                        <input placeholder="Şablon Adı (Örn: Sabah)" value={newTemplate.label} onChange={e => setNewTemplate({ ...newTemplate, label: e.target.value })} className="w-full border rounded px-2 py-1 text-xs" />
                        <div className="grid grid-cols-2 gap-2">
                            <TimeInput inputId="template-new-start" value={newTemplate.start} onChange={v => setNewTemplate({ ...newTemplate, start: v })} onComplete={() => document.getElementById("template-new-end")?.focus()} placeholder="00:00" />
                            <TimeInput inputId="template-new-end" value={newTemplate.end} onChange={v => setNewTemplate({ ...newTemplate, end: v })} placeholder="00:00" />
                        </div>
                        <select value={newTemplate.task || ''} onChange={e => setNewTemplate({ ...newTemplate, task: e.target.value })} className="w-full border rounded px-2 py-1 text-xs">
                            <option value="" disabled>Görev Seçiniz</option>
                            {renderTaskOptions()}
                        </select>
                    </div>
                    <button onClick={onAdd} className="w-full bg-blue-600 text-white text-xs font-bold py-1.5 rounded hover:bg-blue-700 transition">Şablonu Kaydet</button>
                    {templates.length > 0 && (
                        <div className="mt-3 border-t pt-2">
                            <div className="text-[9px] text-slate-400 mb-1">Kayıtlı Şablonlar <span className="text-blue-500">(sürükle-bırak ile sırala)</span>:</div>
                            <div className="space-y-2">
                                {templates.map((t, tIdx) => (
                                    <div key={t.ID} data-template-idx={tIdx}>
                                        {editingTemplate?.ID === t.ID ? (
                                            <div className="p-2 bg-yellow-50 border-2 border-yellow-300 rounded-lg space-y-2">
                                                <input value={editingTemplate.BASLIK} onChange={e => setEditingTemplate({ ...editingTemplate, BASLIK: e.target.value })} className="w-full border rounded px-2 py-1 text-xs" />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <TimeInput inputId="template-edit-start" value={editingTemplate.BASLANGIC} onChange={v => setEditingTemplate({ ...editingTemplate, BASLANGIC: v })} onComplete={() => document.getElementById("template-edit-end")?.focus()} placeholder="00:00" />
                                                    <TimeInput inputId="template-edit-end" value={editingTemplate.BITIS} onChange={v => setEditingTemplate({ ...editingTemplate, BITIS: v })} placeholder="00:00" />
                                                </div>
                                                <select value={editingTemplate.GOREV || ''} onChange={e => setEditingTemplate({ ...editingTemplate, GOREV: e.target.value })} className="w-full border rounded px-2 py-1 text-xs">
                                                    <option value="" disabled>Görev Seçiniz</option>
                                                    {renderTaskOptions()}
                                                </select>
                                                <div className="flex gap-2">
                                                    <button onClick={onUpdate} className="flex-1 bg-green-600 text-white text-xs font-bold py-1.5 rounded hover:bg-green-700">✓ Güncelle</button>
                                                    <button onClick={() => setEditingTemplate(null)} className="px-3 bg-slate-300 text-slate-700 text-xs font-bold rounded hover:bg-slate-400">İptal</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div 
                                                {...dragProps(tIdx)}
                                                className={`flex items-center gap-2 p-2 bg-white border rounded hover:bg-slate-50 transition cursor-grab active:cursor-grabbing ${dragIdx === tIdx ? 'opacity-40 scale-95' : ''} ${dragOverIdx === tIdx && dragIdx !== tIdx ? 'border-blue-400 bg-blue-50 border-2' : ''}`}
                                                style={{ userSelect: 'none' }}
                                            >
                                                <span className="text-slate-300 hover:text-slate-500 cursor-grab text-sm px-0.5" title="Sürükle">⠿</span>
                                                <div className="flex-1 text-[10px]"> <b className="text-slate-800">{t.BASLIK}</b> <span className="text-slate-500 ml-2">{t.BASLANGIC}-{t.BITIS}</span> {t.GOREV && <span className="text-purple-600 ml-2">({t.GOREV})</span>} </div>
                                                <button onClick={() => setEditingTemplate(t)} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold hover:bg-blue-100">✏️</button>
                                                <button onClick={() => onDelete(t.ID)} className="px-2 py-1 bg-red-50 text-red-600 rounded text-[10px] font-bold hover:bg-red-100">🗑️</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                {templates.length === 0 && !show && <div className="text-xs text-slate-400 italic">Henüz şablon yok. 'Düzenle' diyerek ekleyin.</div>}
                {templates.map((t, tIdx) => (
                    <button 
                        key={t.ID} 
                        {...dragProps(tIdx)}
                        onClick={() => { if (!touchRef.current.moved) onApply(t); }} 
                        className={`px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition shadow-sm flex flex-col items-center min-w-[60px] ${dragIdx === tIdx ? 'opacity-40 scale-95' : ''} ${dragOverIdx === tIdx && dragIdx !== tIdx ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`} 
                        title={t.GOREV ? `Görev: ${t.GOREV}` : 'Sadece saat uygular'}
                    >
                        <span>{t.BASLIK}</span> <span className="text-[9px] opacity-70 font-normal">{t.BASLANGIC}-{t.BITIS}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Shift Wizard (Toplu Ekleme) ---
const ShiftWizard = ({ isOpen, onClose, targetName, form, setForm, templates, showTemplateManager, setShowTemplateManager, newTemplate, setNewTemplate, editingTemplate, setEditingTemplate, onAddTemplate, onUpdateTemplate, onDeleteTemplate, onApply, currentUnit, onReorderTemplates, tasks }) => {
    if (!isOpen) return null;

    // Günlük İzin kontrolü - görev türü değiştiğinde saatleri ayarla
    const handleTaskChange = (idx, newTask) => {
        const newShifts = [...form.shifts];
        newShifts[idx].task = newTask;
        
        // Günlük İzin seçildiğinde: saatleri, kapsayan shift'in saatlerine göre ayarla
        const isGunlukIzin = newTask === 'Günlük İzin' || newTask === 'Günlük izin';
        if (isGunlukIzin) {
            // Bir önceki görevin bitiş saatini başlangıç olarak al
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

    // Başlangıç saati değiştiğinde: önceki görevin bitişinden önce olamaz (Günlük İzin hariç)
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

    // Yeni görev ekleme: başlangıç saatini otomatik doldur (Günlük İzin'den sonra otomatik doldurma)
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

// --- Cell Edit Modal (Ana Düzenleme Modalı) ---
const CellEditModal = ({ isOpen, onClose, cellEdit, setCellEdit, staffName, onSave, templates, showTemplateManager, setShowTemplateManager, newTemplate, setNewTemplate, editingTemplate, setEditingTemplate, onAddTemplate, onUpdateTemplate, onDeleteTemplate, currentUnit, tasks, currentUser, leaveStartDate, setLeaveStartDate, leaveEndDate, setLeaveEndDate, leaveStartTime, setLeaveStartTime, leaveEndTime, setLeaveEndTime, minDateLimit, toast, timeToMin, onReorderTemplates }) => {
    if (!isOpen || !cellEdit) return null;
    
    // Teknik Servis yetki kontrolü
    const isTeknikServis = currentUser?.username === 'teknikservis';

    // Görev türü değiştiğinde - Günlük İzin mantığı
    const handleTaskChange = (idx, newTask) => {
        const ns = [...cellEdit.shifts];
        ns[idx].task = newTask;
        
        const isGunlukIzin = newTask === 'Günlük İzin' || newTask === 'Günlük izin';
        if (isGunlukIzin) {
            // Bir önceki görevin bitişini başlangıç, bir sonrakinin başlangıcını bitiş yap
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

    // Başlangıç saati değişikliği - önceki görevin bitişinden önce olamaz (Günlük İzin hariç)
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

    // Yeni görev ekleme - önceki görevin bitişini başlangıç olarak ata (Günlük İzin'den sonra otomatik doldurma yok)
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

    // Görev listesini güvenli render etme
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

                    {/* İzin Tarihleri */}
                    {cellEdit.tag && cellEdit.tag !== 'IDARI' && (
                        <div className={`rounded-2xl p-4 border-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300 ${cellEdit.tag === 'YILLIK' ? 'bg-red-50 border-red-100' : cellEdit.tag === 'HAFTALIK' ? 'bg-purple-50 border-purple-100' : 'bg-green-50 border-green-100'}`}>
                            <div className={`text-center text-xs font-bold uppercase tracking-wide mb-3 ${cellEdit.tag === 'YILLIK' ? 'text-red-600' : cellEdit.tag === 'HAFTALIK' ? 'text-purple-600' : 'text-green-600'}`}> {LEAVE_TYPES.find(t => t.value === cellEdit.tag)?.label} Tarihleri </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div> <label className={`block text-xs font-semibold mb-2 ${cellEdit.tag === 'YILLIK' ? 'text-red-700' : cellEdit.tag === 'HAFTALIK' ? 'text-purple-700' : 'text-green-700'}`}>Başlangıç</label> <input type="date" className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm bg-white focus:outline-none focus:ring-2 transition ${cellEdit.tag === 'YILLIK' ? 'border-red-200 focus:border-red-500 focus:ring-red-200' : cellEdit.tag === 'HAFTALIK' ? 'border-purple-200 focus:border-purple-500 focus:ring-purple-200' : 'border-green-200 focus:border-green-500 focus:ring-green-200'}`} value={leaveStartDate} min={minDateLimit} onChange={e => { setLeaveStartDate(e.target.value); if (e.target.value > leaveEndDate) setLeaveEndDate(e.target.value); }} /> </div>
                                <div> <label className={`block text-xs font-semibold mb-2 ${cellEdit.tag === 'YILLIK' ? 'text-red-700' : cellEdit.tag === 'HAFTALIK' ? 'text-purple-700' : 'text-green-700'}`}>Bitiş</label> <input type="date" className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm bg-white focus:outline-none focus:ring-2 transition ${cellEdit.tag === 'YILLIK' ? 'border-red-200 focus:border-red-500 focus:ring-red-200' : cellEdit.tag === 'HAFTALIK' ? 'border-purple-200 focus:border-purple-500 focus:ring-purple-200' : 'border-green-200 focus:border-green-500 focus:ring-green-200'}`} value={leaveEndDate} min={leaveStartDate} onChange={e => setLeaveEndDate(e.target.value)} /> </div>
                            </div>
                        </div>
                    )}

                    {/* İdari İzin */}
                    {cellEdit.tag === 'IDARI' && (
                        <div className="rounded-2xl p-4 border-2 mb-4 bg-orange-50 border-orange-100 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="text-center text-xs font-bold uppercase tracking-wide text-orange-600 mb-3"> {dayNames[cellEdit.day]} - İdari İzin Saatleri </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div> <label className="block text-xs font-semibold text-orange-700 mb-2">Başlangıç Saati</label> <input type="time" className="w-full px-3 py-2.5 rounded-xl border-2 text-sm" value={leaveStartTime} onChange={(e) => setLeaveStartTime(e.target.value)} /> </div>
                                <div> <label className="block text-xs font-semibold text-orange-700 mb-2">Bitiş Saati</label> <input type="time" className="w-full px-3 py-2.5 rounded-xl border-2 text-sm" value={leaveEndTime} onChange={(e) => setLeaveEndTime(e.target.value)} /> </div>
                            </div>
                        </div>
                    )}

                    {/* SHIFT GİRİŞİ */}
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