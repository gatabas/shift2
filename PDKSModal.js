/* public/js/modals/PDKSModal.js - PDKS Karsilastirma Modali */
/* Global bagimliliklar: dayNames */

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
