/* public/js/components.js - Arayüz Parçaları */

// --- Küçük Bileşenler ---
const Btn = ({ children, onClick, variant = 'primary', disabled }) => (<button onClick={onClick} disabled={disabled} className={`px-4 py-2.5 rounded-xl body-small shadow-sm transition active:scale-95 ${variant==='primary' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50' } disabled:opacity-50`}>{children}</button>);
const IconBtn = ({ icon, label, onClick }) => (<button onClick={onClick} className="flex flex-col items-center justify-center p-1 text-slate-500 active:text-blue-600 active:scale-95 w-16"><span className="text-xl mb-0.5">{icon}</span><span className="text-[9px] font-bold leading-none text-center whitespace-nowrap">{label}</span></button>);
const Input = p => <input {...p} className={`w-full rounded-xl border border-gray-300 px-3 py-2 body-small focus:outline-none focus:ring-2 focus:ring-black /20 bg-slate-50 focus:bg-white transition ${p.className || '' }`} />;

// --- Toast Bildirimi ---
function useToast() {
    const [msg, setMsg] = useState(null);
    const show = (t, isError = false) => { setMsg({ text: t, error: isError }); setTimeout(() => setMsg(null), 2000) };
    const node = msg ? (
        msg.error ? (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto bg-red-600 text-white px-6 py-5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(220,38,38,0.5)] font-bold text-base flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-200 border-4 border-white/20 min-w-[250px] text-center">
                    <span className="text-3xl">⚠️</span><span>{msg.text}</span>
                </div>
            </div>
        ) : (
            <div className="fixed top-4 right-4 z-[9999] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl body-small toast-enter flex items-center gap-3 border border-slate-700">
                <span className="text-xl">✅</span><span className="font-semibold">{msg.text}</span>
            </div>
        )
    ) : null;
    return { show, node };
}

// --- Time Input ---
const TimeInput = ({ value, onChange, minTime, placeholder = "00:00", onComplete, inputId }) => {
    const inputRef = useRef(null);
    
    const handleFocus = (e) => {
        // Tıklayınca her zaman başa al
        setTimeout(() => e.target.setSelectionRange(0, 0), 0);
    };
    
    const handleClick = (e) => {
        // Her tıklamada başa al
        e.target.setSelectionRange(0, 0);
    };
    
    const handleKeyDown = (e) => {
        // Backspace veya Delete: tümünü temizle
        if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            onChange('');
            return;
        }
        
        // Tab, Enter, ok tuşları
        const allowedKeys = ['Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        if (allowedKeys.includes(e.key)) return;
        
        // Sadece rakamlar
        if (!/^\d$/.test(e.key)) {
            e.preventDefault();
            return;
        }
    };
    
    const handleChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        
        // Maksimum 4 rakam
        if (val.length > 4) val = val.substring(0, 4);
        
        // Saat kontrolü
        if (val.length >= 2) {
            let hours = val.substring(0, 2);
            if (parseInt(hours) > 23) hours = '23';
            
            // Dakika kontrolü
            if (val.length >= 3) {
                let minutes = val.substring(2, 4);
                if (parseInt(minutes) > 59) minutes = '59';
                val = hours + minutes;
            } else {
                val = hours;
            }
        }
        
        // Format: HH:MM
        let formatted = val;
        if (val.length >= 3) {
            formatted = val.substring(0, 2) + ':' + val.substring(2);
        }
        
        onChange(formatted);
        
        // 4 rakam (HH:MM) tamamlandıysa bir sonraki inputa geç
        if (val.length === 4 && onComplete) {
            setTimeout(() => onComplete(), 10);
        }
    };
    
    const handleBlur = () => {
        let val = (value || '').replace(/\D/g, '');
        
        // Boşsa dokunma
        if (val.length === 0) {
            onChange('');
            return;
        }
        
        // Eksik rakamları 0 ile doldur
        if (val.length === 1) val = '0' + val + '00'; // 5 → 05:00
        if (val.length === 2) val = val + '00';       // 12 → 12:00
        if (val.length === 3) val = val + '0';        // 123 → 12:30
        
        // Format
        if (val.length === 4) {
            onChange(val.substring(0, 2) + ':' + val.substring(2, 4));
        }
    };
    
    return (
        <input 
            id={inputId} 
            ref={inputRef} 
            type="text" 
            value={value || ''} 
            onChange={handleChange} 
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onClick={handleClick}
            onBlur={handleBlur} 
            placeholder={placeholder} 
            maxLength={5} 
            className="w-full px-4 py-4 rounded-xl border border-slate-300 text-center text-lg font-semibold bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition placeholder:text-slate-400 text-slate-700" 
        />
    );
};

// --- YARDIMCI: Expandable Panel (Açılır/Kapanır Kutu) ---
const ExpandablePanel = ({ title, iconColor, iconBg, count, children, defaultExpanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="flex flex-col bg-slate-900 rounded-xl shadow-lg border border-slate-700 overflow-hidden transition-all duration-300 no-print h-full justify-between">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${iconBg} animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.2)]`}></div>
                        <h3 className="text-white font-bold text-sm tracking-wide uppercase">{title}</h3>
                    </div>
                    {count !== undefined && (
                        <span className="bg-slate-800 border border-slate-600 text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-bold font-mono">
                            {count}
                        </span>
                    )}
                </div>

                {/* İçerik Alanı - Animasyonlu Yükseklik */}
                <div className={`relative transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-[140px] opacity-90'} overflow-hidden`}>
                    <div className="p-3">
                        {children}
                    </div>
                    
                    {/* Kapalıyken Altta Beliren Gradient (Fade Out Efekti) */}
                    {!isExpanded && (
                        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent pointer-events-none"></div>
                    )}
                </div>
            </div>

            {/* Alt Kontrol Çubuğu (Genişlet/Daralt) */}
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="w-full py-2 bg-slate-800/50 hover:bg-slate-800 border-t border-slate-700 text-[11px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center justify-center gap-2 transition-all group cursor-pointer mt-auto"
            >
                {isExpanded ? (
                    <><span>Daralt</span><span className="group-hover:-translate-y-0.5 transition-transform">▲</span></>
                ) : (
                    <><span>Tümünü Göster</span><span className="group-hover:translate-y-0.5 transition-transform">▼</span></>
                )}
            </button>
        </div>
    );
};


// --- Header (Üst Bant) ---
function HeaderBrand({ units, currentUnit, setCurrentUnit, availableUnits, currentUser, isVisible }) {
    const fullName = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') || (currentUser?.username || '');
    return (
        <div className={`bg-white border-b no-print sticky top-0 z-40 shadow-sm transition-transform duration-300 ${
            isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}>
            <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600" />
            <div className="max-w-[1800px] mx-auto px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center justify-start gap-4 w-full lg:w-auto">
                    <img src="img/logo.png" className="h-12 w-12 object-contain" onError={(e) => e.target.style.display = 'none'} />
                    <div className="leading-none">
                        <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-0.5">PAMUKKALE ÜNİVERSİTESİ SPOR MERKEZİ</div>
                        <div className="text-2xl font-black tracking-tight text-slate-900">SHIFT <span className="text-blue-600">SİSTEMİ</span></div>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                    <div className="flex items-center gap-3 flex-1 lg:flex-none">
                        <label className="hidden lg:block label-small text-slate-400 whitespace-nowrap">ÇALIŞILAN BİRİM</label>
                        {availableUnits.length > 1 ? (
                        <div className="relative w-full lg:w-48">
                            <select value={currentUnit?.id || '' } onChange={(e) => { const u = units.find(x => x.id === e.target.value); if (u) setCurrentUnit(u); }} className="appearance-none w-full bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-700 body-normal py-2 pl-3 pr-8 rounded-xl outline-none transition cursor-pointer shadow-sm truncate">
                                {availableUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        ) : (currentUnit && <div className="w-full lg:w-auto body-normal text-slate-800 bg-slate-100 px-3 py-2 rounded-lg border text-center lg:text-left">{currentUnit.name}</div>)}
                    </div>
                    <div className="flex items-center gap-2">
                        {currentUser?.role === 'admin' && (<a href="admin.html" className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white px-3 py-2 rounded-xl transition shadow-sm active:scale-95 no-print"><span className="text-sm">⚙️</span><span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">Admin</span></a>)}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (<a href="stats.html" className="flex items-center justify-center gap-2 bg-white border border-orange-200 hover:bg-orange-50 text-orange-700 hover:text-orange-900 px-3 py-2 rounded-xl transition shadow-sm active:scale-95 no-print"><span className="text-sm">📊</span><span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">İstatistik</span></a>)}
                    </div>
                    <div className="hidden lg:block w-px h-8 bg-slate-200"></div>
                    <div className="hidden lg:flex items-center gap-3">
                        <div className="text-right leading-tight">
                            <div className="label-small text-slate-400">Aktif Kullanıcı</div>
                            <div className="body-normal text-slate-800">{fullName}</div>
                        </div>
                        <button onClick={async ()=> { await api(API.AUTH_LOGOUT, { method: 'POST' }); window.location.href = 'index.html'; }} className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 p-2.5 rounded-xl transition border border-slate-200 hover:border-red-200 shadow-sm group">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}