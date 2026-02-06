/* public/js/modals/ArchiveModal.js - Arsiv Goruntuleme Modali */

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
                                {/* Tablo icerigi dinamik olusturulur */}
                                <div className="text-center p-10 text-slate-400">Arşiv görüntüleme modülü</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
