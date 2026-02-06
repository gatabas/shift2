/* public/js/modals/EmailModal.js - E-posta Gonderme Modali */

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
