/* public/js/modals/TemplateManager.js - Hizli Sablon Yonetici Componenti */
/* Global bagimliliklar: api, getTaskOptions, TimeInput */

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
