/* public/js/app.js - Ana Uygulama (Hook'larla refactor edilmis) */

// Saat limitleri hesaplama fonksiyonu
function getHourLimits(currentUser, currentUnit, staffMember) {
    if (currentUser?.username === 'teknikservis') {
        return { min: 0, max: Infinity, withMeal: Infinity };
    }
    const isFitness = currentUnit?.name === 'Technogym Fitness' || currentUnit?.name === 'Genel Fitness';
    if (isFitness && staffMember?.type === 'staff') {
        return { min: 2400, max: 3060, withMeal: 3060 };
    }
    return { min: 2400, max: 2400, withMeal: 2700 };
}

function App() {
    const toast = useToast();
    const { useState, useEffect, useCallback, useMemo, useRef } = React;

    // --- Auth Hook ---
    const {
        currentUser, setCurrentUser,
        units, setUnits,
        currentUnit, setCurrentUnit,
        isAdmin, isManager,
        availableUnits
    } = useAuth();

    // --- Week Navigation ---
    const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
    const weekISO = useMemo(() => toLocalISO(weekStart), [weekStart]);
    const currentWeekISO = useMemo(() => toLocalISO(startOfWeekMonday(new Date())), []);
    const isPastWeek = weekISO < currentWeekISO;
    const isCurrentWeek = weekISO === currentWeekISO;
    const [now, setNow] = useState(new Date());

    // Header visibility
    const [headerVisible, setHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setHeaderVisible(false);
            }
            if (currentScrollY < 10) {
                setHeaderVisible(true);
            } else {
                setHeaderVisible(false);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const canEdit = isAdmin || isManager || (!isPastWeek && currentUser?.role === 'staff');
    const canEditDay = (dayIndex) => {
        if (isAdmin || isManager) return true;
        if (!currentUser) return false;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const shiftDate = new Date(weekISO); shiftDate.setDate(shiftDate.getDate() + dayIndex); shiftDate.setHours(0, 0, 0, 0);
        return shiftDate >= today;
    };
    const canReorder = currentUser && currentUser.role !== 'manager';

    useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);

    const isShiftActive = (dayIdx, start, end) => {
        if (!isCurrentWeek) return false;
        const currentDayIdx = (now.getDay() + 6) % 7;
        if (dayIdx !== currentDayIdx) return false;
        const currentMin = now.getHours() * 60 + now.getMinutes();
        const sMin = timeToMin(start);
        const eMin = timeToMin(end);
        return currentMin >= sMin && currentMin < eMin;
    };

    // --- Schedule Data Hook ---
    const {
        staff, setStaff,
        shifts, setShifts,
        note, setNote,
        templates, setTemplates,
        tasks, setTasks,
        allFitnessShifts, allFitnessStaff,
        loadData
    } = useScheduleData(currentUnit, currentUser, units, weekISO, weekStart, toast);

    // Update email subject when loadData runs
    const [emailSubjectReady, setEmailSubjectReady] = useState(false);
    useEffect(() => {
        if (currentUnit && weekStart) {
            setEmailSubjectReady(true);
        }
    }, [staff]); // triggers after loadData sets staff

    // --- Template Hook ---
    const {
        showTemplateManager, setShowTemplateManager,
        newTemplate, setNewTemplate,
        editingTemplate, setEditingTemplate,
        handleAddTemplate, handleDeleteTemplate, handleUpdateTemplate,
        loadTemplates
    } = useTemplates(currentUnit, loadData, toast);

    // --- Archive Hook ---
    const {
        archiveOpen, setArchiveOpen,
        archiveList, archiveView, setArchiveView,
        openArchive, createArchive, viewArchive, deleteArchive
    } = useArchive(currentUnit, shifts, note, staff, weekStart, weekISO, toast);

    // --- Email Hook ---
    const {
        emailOpen, setEmailOpen,
        emailForm, setEmailForm,
        emailSending,
        sendEmail, downloadExcel, handleShare
    } = useEmail(currentUnit, staff, shifts, note, weekStart, weekISO, toast);

    // Sync email subject after data loads
    useEffect(() => {
        if (currentUnit && weekStart && emailSubjectReady) {
            setEmailForm(prev => ({ ...prev, subject: `${fmtTR(weekStart)} - ${fmtTR(addDays(weekStart, 6))} \u2022 ${currentUnit.name} Shift` }));
        }
    }, [currentUnit, weekStart, emailSubjectReady]);

    // --- PDKS Hook ---
    const {
        pdksOpen, setPdksOpen,
        pdksData, pdksLoading,
        loadPDKSComparison
    } = usePdks(currentUnit, weekISO, toast);

    // --- Modal States ---
    const [cellEdit, setCellEdit] = useState(null);
    const [copiedDay, setCopiedDay] = useState(null);
    const [copiedWeek, setCopiedWeek] = useState(null);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const [mobileMode, setMobileMode] = useState('cards');
    const [expandedStaff, setExpandedStaff] = useState(null);
    const [leaveStartDate, setLeaveStartDate] = useState("");
    const [leaveEndDate, setLeaveEndDate] = useState("");
    const [leaveStartTime, setLeaveStartTime] = useState("");
    const [leaveEndTime, setLeaveEndTime] = useState("");
    const [minDateLimit, setMinDateLimit] = useState("");
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardTarget, setWizardTarget] = useState(null);
    const [wizardForm, setWizardForm] = useState({ days: [0, 1, 2, 3, 4], shifts: [{ start: '', end: '', task: '' }] });

    // --- Drag & Drop ---
    const [draggedStaffId, setDraggedStaffId] = useState(null);
    const handleDragStart = (e, id) => { setDraggedStaffId(id); e.dataTransfer.effectAllowed = "move"; e.target.style.opacity = '0.5'; };
    const handleDragEnd = (e) => { e.target.style.opacity = '1'; setDraggedStaffId(null); };
    const handleDragOver = (e) => { e.preventDefault(); };
    const handleDrop = async (e, targetId, type) => {
        e.preventDefault(); if (!draggedStaffId || draggedStaffId === targetId) return;
        const draggedItem = staff.find(s => s.id === draggedStaffId); const targetItem = staff.find(s => s.id === targetId);
        if (!draggedItem || !targetItem || draggedItem.type !== targetItem.type) return;
        const currentGroupStaff = staff.filter(s => s.type === type).sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
        const otherStaff = staff.filter(s => s.type !== type);
        const oldIndex = currentGroupStaff.findIndex(s => s.id === draggedStaffId); const newIndex = currentGroupStaff.findIndex(s => s.id === targetId);
        const newGroupOrder = [...currentGroupStaff]; newGroupOrder.splice(oldIndex, 1); newGroupOrder.splice(newIndex, 0, draggedItem);
        const updatedGroupWithOrder = newGroupOrder.map((s, index) => ({ ...s, order: index }));
        setStaff([...otherStaff, ...updatedGroupWithOrder].sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name)));
        try { const orderIds = updatedGroupWithOrder.map(s => s.id); await api(API.STAFF_ORDER, { method: 'POST', body: JSON.stringify({ order: orderIds }) }); } catch (err) { toast.show("S\u0131ralama hatas\u0131!", true); loadData(); }
    };

    // --- Copy/Paste ---
    const handleCopyDay = (staffId, day) => { const dayShifts = shifts.filter(s => s.staffId === staffId && s.day === day); if (dayShifts.length === 0) { toast.show("Bu g\u00FCnde vardiya yok", true); return; } setCopiedDay({ staffId, day, shifts: dayShifts }); setCopiedWeek(null); const person = staff.find(s => s.id === staffId); toast.show(`${person?.name} - ${dayNames[day]} kopyaland\u0131`); };
    const handleCopyWeek = (staffId) => {
        const weekShifts = shifts.filter(s => s.staffId === staffId);
        if (weekShifts.length === 0) { toast.show("Bu personelin vardiyas\u0131 yok", true); return; }

        const groupedByDay = {};
        weekShifts.forEach(s => {
            if (!groupedByDay[s.day]) groupedByDay[s.day] = [];
            groupedByDay[s.day].push(s);
        });

        console.log('\u{1F535} KOPYALANAN HAFTA:', groupedByDay);
        Object.keys(groupedByDay).forEach(day => {
            console.log(`  G\u00FCn ${day}:`, groupedByDay[day].map(s => `${s.task} (tag: ${s.tag})`));
        });

        setCopiedWeek({ staffId, shifts: groupedByDay });
        setCopiedDay(null);
        const person = staff.find(s => s.id === staffId);
        toast.show(`${person?.name} - T\u00FCm hafta kopyaland\u0131`);
    };
    const handlePasteDay = async (targetStaffId, targetDay) => {
        if (!copiedDay) { toast.show("\u00D6nce bir g\u00FCn kopyal\u0061y\u0131n", true); return; }

        if (!['admin', 'manager'].includes(currentUser.role)) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetDate = addDays(weekStart, targetDay);
            targetDate.setHours(0, 0, 0, 0);
            if (targetDate < today) {
                toast.show("Ge\u00E7mi\u015F g\u00FCnlere shift yap\u0131\u015Ft\u0131ramazs\u0131n\u0131z!", true);
                return;
            }
        }

        const calcDuration = (sList) => sList.reduce((acc, s) => { const t = (s.task || '').toUpperCase(); if (t.includes('YEMEK') || t.includes('MOLA') || t.includes('\u00C7AY')) return acc; return acc + minDiff(s.start, s.end); }, 0);
        const currentWeekMinutes = shifts.filter(s => s.staffId === targetStaffId && s.day !== targetDay);
        const currentTotal = calcDuration(currentWeekMinutes);
        const newDayTotal = calcDuration(copiedDay.shifts);
        const targetPerson = staff.find(s => s.id === targetStaffId);
        const limits = getHourLimits(currentUser, currentUnit, targetPerson);

        const hasMeal = copiedDay.shifts.some(s => {
            const t = (s.task || '').toUpperCase();
            return t.includes('YEMEK') || t.includes('MOLA');
        });
        const maxLimit = hasMeal ? limits.withMeal : limits.max;

        if (currentTotal + newDayTotal > maxLimit) {
            const hours = (maxLimit / 60).toFixed(0);
            toast.show(`Hata: ${hours} saat s\u0131n\u0131r\u0131 a\u015F\u0131l\u0131yor!`, true);
            return;
        }
        try { const hasLeaveTag = copiedDay.shifts.some(s => ['YILLIK', 'HAFTALIK', 'RAPOR', 'IDARI'].includes(s.tag)); if (hasLeaveTag) { const leaveShift = copiedDay.shifts.find(s => ['YILLIK', 'HAFTALIK', 'RAPOR', 'IDARI'].includes(s.tag)); await api(API.SHIFT, { method: 'POST', body: JSON.stringify({ unit: currentUnit.id, weekISO, staffId: targetStaffId, day: targetDay, shifts: leaveShift.tag === 'IDARI' ? [{ start: leaveShift.start, end: leaveShift.end, task: '\u0130dari \u0130zin' }] : [], tag: leaveShift.tag }) }); } else { const newShifts = copiedDay.shifts.map(s => ({ start: s.start, end: s.end, task: s.task, tag: s.tag || '' })); await api(API.SHIFT, { method: 'POST', body: JSON.stringify({ unit: currentUnit.id, weekISO, staffId: targetStaffId, day: targetDay, shifts: newShifts, tag: '' }) }); } await loadData(); toast.show(`Yap\u0131\u015Ft\u0131r\u0131ld\u0131`); } catch (e) { toast.show(e.message, true); }
    };
    const handlePasteWeek = async (targetStaffId) => {
        if (!copiedWeek) { toast.show("\u00D6nce bir hafta kopyal\u0061y\u0131n", true); return; }
        let totalCopiedMinutes = 0;
        let hasMeal = false;

        for (let i = 0; i < 7; i++) {
            const shifts = copiedWeek.shifts[i] || [];
            const hasLeave = shifts.some(s => ['YILLIK', 'HAFTALIK', 'RAPOR', 'IDARI'].includes(s.tag));

            if (!hasLeave) {
                shifts.forEach(s => {
                    const t = (s.task || '').toUpperCase();
                    if (t.includes('YEMEK') || t.includes('MOLA')) hasMeal = true;
                    if (!t.includes('YEMEK') && !t.includes('MOLA') && !t.includes('\u00C7AY')) {
                        totalCopiedMinutes += minDiff(s.start, s.end);
                    }
                });
            }
        }

        const targetPerson = staff.find(s => s.id === targetStaffId);
        const limits = getHourLimits(currentUser, currentUnit, targetPerson);
        const maxLimit = hasMeal ? limits.withMeal : limits.max;

        if (totalCopiedMinutes > maxLimit) {
            const hours = (maxLimit / 60).toFixed(0);
            toast.show(`Hata: Kopyalanan hafta ${hours} saat s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor!`, true);
            return;
        }
        try {
            const promises = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            console.log('\u{1F7E2} YAPI\u015ETIRILACAK HAFTA:', copiedWeek);

            for (let i = 0; i < 7; i++) {
                if (!['admin', 'manager'].includes(currentUser.role)) {
                    const targetDate = addDays(weekStart, i);
                    targetDate.setHours(0, 0, 0, 0);
                    if (targetDate < today) {
                        console.log(`\u23ED\uFE0F G\u00FCn ${i} ge\u00E7mi\u015F, atlan\u0131yor`);
                        continue;
                    }
                }

                const dayShifts = copiedWeek.shifts[i] || [];
                const hasLeaveTag = dayShifts.some(s => ['YILLIK', 'HAFTALIK', 'RAPOR', 'IDARI'].includes(s.tag));

                console.log(`G\u00FCn ${i}:`, {
                    shiftsCount: dayShifts.length,
                    hasLeaveTag,
                    shifts: dayShifts.map(s => `${s.task} (tag: ${s.tag})`)
                });

                if (hasLeaveTag) {
                    const leaveShift = dayShifts.find(s => ['YILLIK', 'HAFTALIK', 'RAPOR', 'IDARI'].includes(s.tag));
                    console.log(`  \u2705 \u0130zin yap\u0131\u015Ft\u0131r\u0131l\u0131yor: ${leaveShift.tag}`);
                    promises.push(api(API.SHIFT, {
                        method: 'POST',
                        body: JSON.stringify({
                            unit: currentUnit.id,
                            weekISO,
                            staffId: targetStaffId,
                            day: i,
                            shifts: leaveShift.tag === 'IDARI' ? [{ start: leaveShift.start, end: leaveShift.end, task: '\u0130dari \u0130zin' }] : [],
                            tag: leaveShift.tag
                        })
                    }));
                } else {
                    const newShifts = dayShifts.map(s => ({ start: s.start, end: s.end, task: s.task, tag: s.tag || '' }));
                    console.log(`  \u2705 Normal shift yap\u0131\u015Ft\u0131r\u0131l\u0131yor: ${newShifts.length} shift`);
                    promises.push(api(API.SHIFT, {
                        method: 'POST',
                        body: JSON.stringify({
                            unit: currentUnit.id,
                            weekISO,
                            staffId: targetStaffId,
                            day: i,
                            shifts: newShifts,
                            tag: ''
                        })
                    }));
                }
            }

            console.log(`\u{1F4E4} Toplam ${promises.length} API \u00E7a\u011Fr\u0131s\u0131 yap\u0131l\u0131yor...`);
            await Promise.all(promises);
            await loadData();
            toast.show(`T\u00FCm hafta aktar\u0131ld\u0131`);
        } catch (e) {
            console.error('\u274C Paste week error:', e);
            toast.show(e.message, true);
        }
    };

    // --- Actions ---
    const handleRemoveStaff = async (id) => { if (!confirm("Silinsin mi?")) return; try { await api(`${API.STAFF}/${id}`, { method: 'DELETE' }); await loadData(); toast.show("Silindi"); } catch (e) { toast.show(e.message, true); } };
    const handleAddStaff = async (name, color, type) => { if (!name || !name.trim()) { toast.show("\u0130sim bo\u015F olamaz!", true); return; } try { await api(API.STAFF, { method: 'POST', body: JSON.stringify({ unit: currentUnit.id, name: name.trim(), color: color || '#3b82f6', type: type || 'staff' }) }); await loadData(); toast.show("Personel eklendi"); } catch (e) { toast.show(e.message, true); } };
    const saveNote = async (val) => { setNote(val); };
    const pushNote = async () => { if (!canEdit) return; try { await api(API.NOTE, { method: 'POST', body: JSON.stringify({ unit: currentUnit.id, weekISO, content: note }) }); toast.show("Not kaydedildi"); } catch (e) { } };

    // --- Cell Edit Modal ---
    const openEdit = async (sid, day) => {
        if (!canEdit) return;
        if (!canEditDay(day)) { toast.show('Ge\u00E7mi\u015F g\u00FCnlerde de\u011Fi\u015Fiklik yap\u0131lamaz!', true); return; }
        const existingShifts = shifts.filter(s => s.staffId === sid && s.day === day).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
        const leaveShift = existingShifts.find(s => ['YILLIK', 'IDARI', 'HAFTALIK', 'RAPOR'].includes(s.tag));
        const leaveTag = leaveShift?.tag || '';
        const selectedDate = toLocalISO(addDays(weekStart, day));

        if (leaveTag && ['YILLIK', 'HAFTALIK', 'RAPOR', 'IDARI'].includes(leaveTag)) {
            try {
                const range = await api(`${API.LEAVE_RANGE}?staffId=${sid}&weekISO=${weekISO}&day=${day}&tag=${leaveTag}`);
                if (range.startDate && range.endDate) {
                    setLeaveStartDate(range.startDate);
                    setLeaveEndDate(range.endDate);
                } else {
                    setLeaveStartDate(selectedDate);
                    setLeaveEndDate(selectedDate);
                }
            } catch (e) {
                console.error('Leave range error:', e);
                setLeaveStartDate(selectedDate);
                setLeaveEndDate(selectedDate);
            }
        } else {
            setLeaveStartDate(selectedDate);
            setLeaveEndDate(selectedDate);
        }

        setMinDateLimit(selectedDate);
        if (leaveTag === 'IDARI' && leaveShift) { setLeaveStartTime(leaveShift.start || ''); setLeaveEndTime(leaveShift.end || ''); } else { setLeaveStartTime(''); setLeaveEndTime(''); }
        let editShifts = [];
        if (existingShifts.length > 0 && !leaveTag) { const normalShifts = existingShifts.filter(s => !['YILLIK', 'IDARI', 'HAFTALIK', 'RAPOR'].includes(s.tag)); if (normalShifts.length > 0) { editShifts = normalShifts.map(s => ({ task: s.task || `${currentUnit.name}`, start: s.start, end: s.end })); } else { editShifts = [{ task: `${currentUnit.name}`, start: '', end: '' }]; } } else { editShifts = [{ task: `${currentUnit.name}`, start: '', end: '' }]; }
        setCellEdit({ staffId: sid, day, shifts: editShifts, tag: leaveTag });
        setNewTemplate({ label: '', start: '', end: '', task: '' });
        setShowTemplateManager(false);
    };

    const handleShiftSave = async (data) => {
        try {
            const { staffId, day, shifts: rawShifts, tag, leaveStartTime, leaveEndTime } = data;
            const newShifts = rawShifts || [];
            if (!['YILLIK', 'HAFTALIK', 'RAPOR', 'IDARI'].includes(tag) && newShifts.length > 1) { const validS = newShifts.filter(s => s.start && s.end && s.start.length === 5 && s.end.length === 5); for (let i = 0; i < validS.length; i++) { for (let j = i + 1; j < validS.length; j++) { const s1 = validS[i]; const s2 = validS[j]; if (timeToMin(s1.start) < timeToMin(s2.end) && timeToMin(s2.start) < timeToMin(s1.end)) { if (!(timeToMin(s1.end) === timeToMin(s2.start) || timeToMin(s2.end) === timeToMin(s1.start))) { toast.show(`\u26A0\uFE0F \u00C7ak\u0131\u015Fma var!`, true); return; } } } } }
            const otherDaysMinutes = shifts.filter(s => s.staffId === staffId && s.day !== day).reduce((acc, s) => { const t = (s.task || '').toUpperCase(); if (t.includes('YEMEK') || t.includes('MOLA') || t.includes('\u00C7AY')) return acc; return acc + minDiff(s.start, s.end); }, 0);
            if (['YILLIK', 'HAFTALIK', 'RAPOR', 'IDARI'].includes(tag) && leaveStartDate && leaveEndDate) {
                toast.show("\u0130zinler i\u015Fleniyor...", false);
                const promises = [];
                const isTeknikServis = currentUser?.username === 'teknikservis';

                const start = new Date(leaveStartDate);
                const end = new Date(leaveEndDate);
                let currentDate = new Date(start);

                const isSingleDayLeave = (leaveStartDate === leaveEndDate);

                while (currentDate <= end) {
                    const currentDayISO = toLocalISO(currentDate);
                    const dayOfWeek = (currentDate.getDay() + 6) % 7;

                    const mondayOfWeek = startOfWeekMonday(currentDate);
                    const currentWeekISO = toLocalISO(mondayOfWeek);

                    const payload = { staffId, unit: currentUnit.id, weekISO: currentWeekISO, day: dayOfWeek, shifts: [], tag: '' };

                    if (tag === 'IDARI') {
                        if (!leaveStartTime || !leaveEndTime) { toast.show("Saatleri giriniz", true); return; }
                        if (!isTeknikServis && timeToMin(leaveEndTime) <= timeToMin(leaveStartTime)) { toast.show("Biti\u015F saati b\u00FCy\u00FCk olmal\u0131", true); return; }

                        if (isSingleDayLeave && dayOfWeek === day) {
                            const existingShifts = shifts.filter(s =>
                                s.staffId === staffId &&
                                s.day === day &&
                                !['YILLIK', 'HAFTALIK', 'RAPOR', 'IDARI'].includes(s.tag) &&
                                s.start && s.end
                            );

                            const leaveStart = timeToMin(leaveStartTime);
                            const leaveEnd = timeToMin(leaveEndTime);
                            const finalShifts = [];

                            existingShifts.forEach(shift => {
                                const shiftStart = timeToMin(shift.start);
                                const shiftEnd = timeToMin(shift.end);

                                if (shiftEnd <= leaveStart) {
                                    finalShifts.push({ start: shift.start, end: shift.end, task: shift.task });
                                }
                                else if (shiftStart >= leaveEnd) {
                                    finalShifts.push({ start: shift.start, end: shift.end, task: shift.task });
                                }
                                else {
                                    if (shiftStart < leaveStart) {
                                        finalShifts.push({ start: shift.start, end: leaveStartTime, task: shift.task });
                                    }
                                    if (shiftEnd > leaveEnd) {
                                        finalShifts.push({ start: leaveEndTime, end: shift.end, task: shift.task });
                                    }
                                }
                            });

                            finalShifts.push({ start: leaveStartTime, end: leaveEndTime, task: '\u0130dari \u0130zin' });
                            finalShifts.sort((a, b) => timeToMin(a.start) - timeToMin(b.start));

                            payload.shifts = finalShifts;
                            payload.tag = '';
                        } else {
                            payload.tag = 'IDARI';
                            payload.shifts = [{ start: leaveStartTime, end: leaveEndTime, task: '\u0130dari \u0130zin' }];
                        }
                    } else {
                        payload.tag = tag;
                        payload.shifts = [{ start: '', end: '', task: '\u0130Z\u0130N' }];
                    }

                    promises.push(api(API.SHIFT, { method: 'POST', body: JSON.stringify(payload) }));
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                await Promise.all(promises);
                toast.show(isSingleDayLeave ? "G\u00FCnl\u00FCk izin eklendi!" : "Tarih aral\u0131\u011F\u0131 kaydedildi!");
            } else {
                const existingShifts = shifts.filter(s =>
                    s.staffId === staffId &&
                    s.day === day &&
                    !['YILLIK', 'HAFTALIK', 'RAPOR', 'IDARI'].includes(s.tag) &&
                    s.start && s.end
                );

                const validNewShifts = newShifts.filter(s => s.start && s.end && s.start.length === 5 && s.end.length === 5);
                if (newShifts.length > 0 && validNewShifts.length === 0 && !tag) {
                    toast.show("Saatleri tam giriniz", true);
                    return;
                }

                let finalShifts = [];

                if (existingShifts.length > 0 && validNewShifts.length > 0) {
                    const allShifts = [
                        ...existingShifts.map(s => ({ start: s.start, end: s.end, task: s.task })),
                        ...validNewShifts.map(s => ({ start: s.start, end: s.end, task: s.task || currentUnit.name }))
                    ];

                    allShifts.sort((a, b) => timeToMin(a.start) - timeToMin(b.start));

                    for (let i = 0; i < allShifts.length; i++) {
                        const current = allShifts[i];
                        const currentStart = timeToMin(current.start);
                        const currentEnd = timeToMin(current.end);

                        if (finalShifts.length > 0) {
                            const lastShift = finalShifts[finalShifts.length - 1];
                            const lastEnd = timeToMin(lastShift.end);

                            if (currentStart < lastEnd) {
                                if (currentEnd <= lastEnd) {
                                    if (currentStart > timeToMin(lastShift.start)) {
                                        finalShifts[finalShifts.length - 1] = {
                                            start: lastShift.start,
                                            end: current.start,
                                            task: lastShift.task
                                        };
                                        finalShifts.push(current);
                                        if (currentEnd < lastEnd) {
                                            finalShifts.push({
                                                start: current.end,
                                                end: lastShift.end,
                                                task: lastShift.task
                                            });
                                        }
                                    }
                                } else {
                                    if (currentStart > timeToMin(lastShift.start)) {
                                        finalShifts[finalShifts.length - 1] = {
                                            start: lastShift.start,
                                            end: current.start,
                                            task: lastShift.task
                                        };
                                    }
                                    finalShifts.push(current);
                                }
                            } else {
                                finalShifts.push(current);
                            }
                        } else {
                            finalShifts.push(current);
                        }
                    }
                } else if (validNewShifts.length > 0) {
                    finalShifts = validNewShifts.map(s => ({
                        start: s.start,
                        end: s.end,
                        task: s.task || currentUnit.name
                    }));
                } else {
                    if (newShifts && newShifts.length === 0) {
                        finalShifts = [];
                    } else {
                        finalShifts = existingShifts.map(s => ({ start: s.start, end: s.end, task: s.task }));
                    }
                }

                let newDayMinutes = finalShifts.reduce((acc, s) => {
                    if (!s.start || !s.end) return acc;
                    const t = (s.task || '').toUpperCase();
                    if (t.includes('YEMEK') || t.includes('MOLA') || t.includes('\u00C7AY')) return acc;
                    return acc + minDiff(s.start, s.end);
                }, 0);

                const targetPerson = staff.find(s => s.id === staffId);
                const limits = getHourLimits(currentUser, currentUnit, targetPerson);
                const totalMinutes = otherDaysMinutes + newDayMinutes;

                const hasMeal = finalShifts.some(s => {
                    const t = (s.task || '').toUpperCase();
                    return t.includes('YEMEK') || t.includes('MOLA');
                });
                const maxLimit = hasMeal ? limits.withMeal : limits.max;

                if (totalMinutes > maxLimit) {
                    const total = (totalMinutes / 60).toFixed(1);
                    const maxHours = (maxLimit / 60).toFixed(0);
                    toast.show(`\u26D4 ${maxHours} Saat \u00DCst S\u0131n\u0131r\u0131 A\u015F\u0131l\u0131yor! (Planlanan: ${total} Saat)`, true);
                    return;
                }

                if (totalMinutes < limits.min) {
                    const total = (totalMinutes / 60).toFixed(1);
                    const minHours = (limits.min / 60).toFixed(0);
                    console.warn(`Alt s\u0131n\u0131r uyar\u0131s\u0131: ${total} saat (minimum: ${minHours} saat)`);
                }

                const payload = {
                    staffId,
                    unit: currentUnit.id,
                    weekISO,
                    day,
                    shifts: finalShifts,
                    tag: ''
                };
                await api(API.SHIFT, { method: 'POST', body: JSON.stringify(payload) });
                toast.show("Shift'ler birle\u015Ftirildi ve kaydedildi!");
            }
            await loadData(); setCellEdit(null);
        } catch (e) { console.error(e); toast.show("Hata: " + e.message, true); }
    };

    const getShiftStr = (sid, d) => {
        let dayShifts = shifts.filter(x => x.staffId === sid && x.day === d).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
        if (dayShifts.length === 0) return <div className="shift-container h-full"></div>;

        const hasIdariTag = dayShifts.some(s => s.tag === 'IDARI');
        if (hasIdariTag) {
            dayShifts = dayShifts.filter(s => {
                if (s.tag === 'IDARI') {
                    if (s.task === '\u0130Z\u0130N' && (!s.start || !s.end)) return false;
                    return true;
                }
                if ((s.task === '\u0130dari \u0130zin' || s.task?.includes('\u0130dari')) && (!s.tag || s.tag === 'null')) return false;
                return true;
            });
        }

        const fullDayLeave = dayShifts.find(s => ['YILLIK', 'HAFTALIK', 'RAPOR'].includes(s.tag));
        if (fullDayLeave) {
            const bgColor = { 'YILLIK': '#dc2626', 'HAFTALIK': '#9333ea', 'RAPOR': '#16a34a' }[fullDayLeave.tag] || '#dc2626';
            const labelText = { 'YILLIK': 'YILLIK \u0130Z\u0130N', 'HAFTALIK': 'HAFTALIK TAT\u0130L', 'RAPOR': 'RAPOR' }[fullDayLeave.tag] || '\u0130Z\u0130N';
            return (
                <div className="w-full h-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: bgColor, fontSize: '11px', letterSpacing: '0.3px', minHeight: '100%' }}>
                    {labelText}
                </div>
            );
        }
        return ( <div className="shift-container"> {dayShifts.map((s, idx) => {
            const isIdariIzin = s.tag === 'IDARI';

            if (isIdariIzin) {
                console.log('\u{1F534} \u0130dari \u0130zin RENDER:', {
                    idx,
                    task: s.task,
                    tag: s.tag,
                    start: s.start,
                    end: s.end
                });
            }

            const isActive = isShiftActive(d, s.start, s.end);
            const isNextDay = s.start && s.end && timeToMin(s.end) <= timeToMin(s.start);

            return (<div key={idx} className={`shift-block ${isActive ? 'live-active-shift' : '' }`}>
                {isActive && (<div className="absolute top-1.5 right-1.5 w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse z-20 border-2 border-white no-print"></div>)}
                <div className="shift-header" style={{ backgroundColor: isIdariIzin ? '#ea580c' : getTaskColor(s.task) }}>
                    {isIdariIzin ? '\u0130dari \u0130zin' : (s.task ? s.task.replace('Antren\u00F6r\u00FC', 'ANT.').replace('&', '&') : `${currentUnit.name}`)}
                </div>
                <div className="shift-body" style={isIdariIzin ? { backgroundColor: '#fff7ed', color: '#ea580c' } : {}}>
                    {dotTime(s.start)} \u2192 {dotTime(s.end)}{isNextDay && <span className="ml-0.5">\u{1F305}</span>}
                </div>
            </div>);
        })} </div> );
    };

    const getTotalMinutes = (sid) => {
        return shifts.filter(s => s.staffId === sid).reduce((a, b) => {
            const t = (b.task || '').toUpperCase();
            if (t.includes('YEMEK') || t.includes('MOLA') || t.includes('\u00C7AY')) return a;
            return a + minDiff(b.start, b.end);
        }, 0);
    };

    const totalHrs = (sid) => {
        const totalMinutes = getTotalMinutes(sid);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes === 0 ? `${hours}` : `${hours}.${minutes.toString().padStart(2, '0')}`;
    };

    const isBelowMinimum = (sid) => {
        const person = staff.find(s => s.id === sid);
        if (!person) return false;
        const limits = getHourLimits(currentUser, currentUnit, person);
        if (limits.min === 0) return false;
        const totalMinutes = getTotalMinutes(sid);
        return totalMinutes > 0 && totalMinutes < limits.min;
    };

    // --- Wizard Functions ---
    const openWizard = (staffId) => {
        setWizardTarget(staffId);
        const existingShifts = shifts.filter(s => s.staffId === staffId);
        let initDays = []; let initShifts = [{ start: '00:00', end: '00:00', task: currentUnit?.name || '' }];
        if (existingShifts.length > 0) {
            initDays = [...new Set(existingShifts.map(s => s.day))].sort();
            const referenceDay = existingShifts[0].day;
            const refDayShifts = existingShifts.filter(s => s.day === referenceDay);
            if (refDayShifts.length > 0) { initShifts = refDayShifts.map(s => ({ start: s.start || '00:00', end: s.end || '00:00', task: s.task || currentUnit?.name || '' })); }
        }
        setWizardForm({ days: initDays, shifts: initShifts }); setWizardOpen(true);
    };
    const handleWizardApply = async () => {
        if (!isAdmin && !isManager) { const today = new Date(); today.setHours(0, 0, 0, 0); const hasPastDay = wizardForm.days.some(dayIndex => { const shiftDate = new Date(weekISO); shiftDate.setDate(shiftDate.getDate() + dayIndex); shiftDate.setHours(0, 0, 0, 0); return shiftDate < today; }); if (hasPastDay) { toast.show('\u26A0\uFE0F Ge\u00E7mi\u015F g\u00FCnlerde de\u011Fi\u015Fiklik yap\u0131lamaz!', true); return; } }
        if (wizardForm.days.length === 0) { if(!confirm("Hi\u00E7bir g\u00FCn se\u00E7mediniz. Bu personelin t\u00FCm haftal\u0131k program\u0131 S\u0130L\u0130NECEK. Emin misiniz?")) return; }
        const validWizardShifts = wizardForm.shifts.filter(s => s.start && s.end && s.start.length === 5 && s.end.length === 5);
        if (wizardForm.days.length > 0 && validWizardShifts.length === 0) { toast.show("L\u00FCtfen en az bir ge\u00E7erli saat girin", true); return; }

        let singleDayMinutes = 0;
        let hasMeal = false;
        validWizardShifts.forEach(s => {
            const taskName = (s.task || '').toUpperCase();
            if (taskName.includes('YEMEK') || taskName.includes('MOLA')) hasMeal = true;
            if (!taskName.includes('YEMEK') && !taskName.includes('MOLA') && !taskName.includes('\u00C7AY')) {
                singleDayMinutes += minDiff(s.start, s.end);
            }
        });
        const totalNewMinutes = singleDayMinutes * wizardForm.days.length;

        const targetPerson = staff.find(s => s.id === wizardTarget);
        const limits = getHourLimits(currentUser, currentUnit, targetPerson);
        const maxLimit = hasMeal ? limits.withMeal : limits.max;

        if (totalNewMinutes > maxLimit) {
            const totalHours = (totalNewMinutes / 60).toFixed(1);
            const maxHours = (maxLimit / 60).toFixed(0);
            toast.show(`\u26D4 ${maxHours} Saat \u00DCst S\u0131n\u0131r\u0131 A\u015F\u0131l\u0131yor! (Planlanan: ${totalHours} Saat)`, true);
            return;
        }

        if (wizardForm.days.length === 7 && totalNewMinutes < limits.min) {
            const totalHours = (totalNewMinutes / 60).toFixed(1);
            const minHours = (limits.min / 60).toFixed(0);
            if (!confirm(`\u26A0\uFE0F UYARI: Haftal\u0131k toplam ${totalHours} saat (\u00D6nerilen minimum: ${minHours} saat)\n\nYine de devam etmek istiyor musunuz?`)) {
                return;
            }
        }

        toast.show("Shiftler g\u00FCncelleniyor...", false);
        try {
            const promises = [];
            wizardForm.days.forEach(dayIdx => { const payload = { unit: currentUnit.id, weekISO, staffId: wizardTarget, day: dayIdx, shifts: validWizardShifts.map(s => ({ start: s.start, end: s.end, task: s.task, tag: '' })), tag: '' }; promises.push(api(API.SHIFT, { method: 'POST', body: JSON.stringify(payload) })); });
            const currentStaffShifts = shifts.filter(s => s.staffId === wizardTarget); const daysToDelete = currentStaffShifts.map(s => s.day).filter(d => !wizardForm.days.includes(d)); const uniqueDaysToDelete = [...new Set(daysToDelete)];
            uniqueDaysToDelete.forEach(dayIdx => { const deletePayload = { unit: currentUnit.id, weekISO, staffId: wizardTarget, day: dayIdx, shifts: [], tag: '' }; promises.push(api(API.SHIFT, { method: 'POST', body: JSON.stringify(deletePayload) })); });
            await Promise.all(promises); await loadData(); setWizardOpen(false); toast.show("\u2705 Hafta ba\u015Far\u0131yla g\u00FCncellendi!");
        } catch (e) { toast.show("Hata: " + e.message, true); }
    };

    if (!currentUser || !currentUnit) return <div className="flex h-screen items-center justify-center text-slate-400 body-large animate-pulse">Y\u00FCkleniyor...</div>;

    return (
        <div className="flex flex-col min-h-screen">
            {toast.node}
            <HeaderBrand units={units} currentUnit={currentUnit} setCurrentUnit={setCurrentUnit} availableUnits={availableUnits} currentUser={currentUser} isVisible={headerVisible} />
            <div className="print-only w-full text-center pb-4 mb-4 border-b border-slate-800"><h1 className="text-xl font-bold text-slate-900">Pamukkale \u00DCniversitesi Spor Merkezi - {currentUnit?.name} {fmtTR(weekStart)} - {fmtTR(addDays(weekStart, 6))} Tarihli Shift</h1></div>
            <div
                className="hidden lg:block bg-white border-b sticky z-20 py-3 px-4 shadow-sm no-print transition-all duration-300"
                style={{ top: headerVisible ? '72px' : '0px' }}
            >
                <div className="max-w-[1800px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 text-blue-800 px-4 py-2.5 rounded-xl shadow-sm select-none"><span className="text-xl">{'\u{1F5D3}\uFE0F'}</span><div className="body-large text-blue-900">{fmtTR(weekStart)} {'\u2014'} {fmtTR(addDays(weekStart, 6))}</div></div>
                        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200"><button onClick={() => setWeekStart(addDays(weekStart, -7))} className="px-4 py-2 rounded-lg body-small text-slate-600 hover:text-black hover:bg-white hover:shadow-sm transition flex items-center gap-1"><span>{'\u25C0'}</span> {'\u00D6nceki'}</button><div className="w-px h-4 bg-slate-300"></div><button onClick={() => setWeekStart(addDays(weekStart, 7))} className="px-4 py-2 rounded-lg body-small text-slate-600 hover:text-black hover:bg-white hover:shadow-sm transition flex items-center gap-1">Sonraki <span>{'\u25B6'}</span></button></div>
                    </div>
                    <div className="flex gap-2">
                        <Btn variant="secondary" onClick={downloadExcel}>Excel'e {'\u0130'}ndir</Btn><Btn variant="secondary" onClick={() => window.print()}>Yazd{'\u0131'}r</Btn><Btn variant="secondary" onClick={() => setEmailOpen(true)}>E-posta G{'\u00F6'}nder</Btn><Btn variant="secondary" onClick={handleShare}>Payla{'\u015F'}</Btn><Btn variant="secondary" onClick={openArchive}>Ar{'\u015F'}iv</Btn>
                        {(isAdmin || isManager) && (<button onClick={loadPDKSComparison} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2"> <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> <span>PDKS</span> </button>)}
                    </div>
                </div>
            </div>
            <div className="flex-1 max-w-[1800px] w-full mx-auto p-3 lg:p-6 grid grid-cols-12 gap-6">
                {(isAdmin || isManager) && (
                <div className="hidden lg:block col-span-2 space-y-6 no-print">
                    {!isManager && (
                    <div className="bg-white rounded-2xl shadow p-4 border border-slate-100">
                        <h3 className="heading-tertiary border-b pb-2 mb-3 text-slate-600">{isAdmin ? '\u{1F465} Personel Y\u00F6netimi' : `\u{1F465} ${currentUnit.name} Personelleri`}</h3>
                        <div className="max-h-64 overflow-y-auto space-y-1 mb-4 pr-1">
                            {Object.entries(STAFF_TYPES).map(([typeKey, typeInfo]) => {
                            const groupStaff = staff.filter(s => s.type === typeKey);
                            if (groupStaff.length === 0) return null;
                            return (
                            <div key={typeKey} className="mb-3">
                                <div className={`text-[10px] font-bold px-2 py-1 rounded mb-1 uppercase tracking-wide ${typeInfo.bg} ${typeInfo.color}`}>{typeInfo.label}</div>
                                {groupStaff.map((s, idx) => (
                                <div key={s.id} draggable={isAdmin} onDragStart={(e) => handleDragStart(e, s.id)} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, s.id, typeKey)} className={`flex justify-between items-center bg-slate-50 p-2 rounded-lg border transition-all mb-1 ${isAdmin ? 'cursor-move hover:shadow-md' : ''}`}>
                                    <div className="flex items-center gap-2 pointer-events-none"> {isAdmin && <span className="text-slate-300 text-[10px]">{'\u2630'}</span>} <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div> <span className="body-small text-slate-700">{s.name}</span> </div>
                                    {isAdmin && <button onClick={() => handleRemoveStaff(s.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">{'\u{1F5D1}\uFE0F'}</button>}
                                </div>
                                ))}
                            </div>
                            );
                            })}
                        </div>
                        {isAdmin && (
                        <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); handleAddStaff(fd.get('name').toUpperCase(), fd.get('color'), fd.get('type')); e.target.reset(); }} className="grid gap-2 border-t pt-3">
                            <input name="name" placeholder="Ad Soyad" className="border rounded-lg px-3 py-2 body-small" required />
                            <select name="type" className="border rounded-lg px-3 py-2 body-small bg-white"> <option value="staff">Kadrolu Personel</option> <option value="student">K{'\u0131'}smi Zamanl{'\u0131'} {'\u00D6\u011F'}renci</option> <option value="iskur">{'\u0130\u015F'}kur Personeli</option> </select>
                            <div className="flex gap-2"> <input name="color" type="color" className="h-8 w-12 rounded cursor-pointer" defaultValue="#3b82f6" /> <button className="bg-slate-900 text-white rounded-lg flex-1 body-small hover:bg-slate-700">Ekle</button> </div>
                        </form>
                        )}
                    </div>
                    )}
                    <div className="bg-white rounded-2xl shadow p-4 border border-slate-100">
                        <h3 className="heading-tertiary border-b pb-2 mb-2 text-slate-600">{isManager ? `${currentUnit.name} Haftal\u0131k Not` : '\u{1F4DD} Haftal\u0131k Not'}</h3>
                        <textarea className="w-full border rounded-lg p-2 body-small h-32 resize-none" placeholder="Notlar..." value={note} onChange={e => saveNote(e.target.value)} onBlur={pushNote} disabled={!canEdit}></textarea>
                    </div>
                </div>
                )}
                <div className={`col-span-12 ${(isAdmin || isManager) ? 'lg:col-span-10' : '' }`}>
                    {isCurrentWeek && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <LiveDashboard localShifts={shifts} staff={staff} now={now} weekISO={weekISO} isAdmin={isAdmin} isManager={isManager} currentUnit={currentUnit} currentUser={currentUser} />
                        <WeeklyLeave
                            shifts={currentUser?.username === 'fitness' ? allFitnessShifts : shifts}
                            staff={currentUser?.username === 'fitness' ? allFitnessStaff : staff}
                            weekStart={weekStart}
                            units={units}
                            currentUnit={currentUnit}
                            currentUser={currentUser}
                        />
                    </div>
                    )}
                    {isPastWeek && <div className="bg-red-800 border border-red-800 text-white p-3 rounded-xl mb-4 body-small text-center no-print">{'\u26A0\uFE0F'} Ge{'\u00E7'}mi{'\u015F'} haftada d{'\u00FC'}zenleme yap{'\u0131'}lamaz.</div>}
                    <div className={`${mobileMode ==='table' ? 'block' : 'hidden' } lg:hidden bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 mb-4 shadow-sm no-print`}>
                        <div className="flex justify-between items-center gap-3">
                            <div className="flex items-center gap-2"><span className="text-2xl">{'\u{1F4C5}'}</span><div className="body-normal text-blue-900">{fmtTR(weekStart)} {'\u2014'} {fmtTR(addDays(weekStart, 6))}</div></div>
                            <button onClick={() => setMobileMode('cards')} className="bg-white border-2 border-blue-600 text-blue-600 px-4 py-2.5 rounded-xl body-small shadow-md hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap">{'\u{1F0CF}'} Kart G{'\u00F6'}r{'\u00FC'}n{'\u00FC'}m{'\u00FC'}ne Ge{'\u00E7'}</button>
                        </div>
                    </div>
                    {/* --- TABLO GORUNUMU --- */}
                    <div className={`${mobileMode === 'table' ? 'block' : 'hidden lg:block'} print-table`}>
                        <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-white">
                            <div className="w-full overflow-hidden">
                                <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
                                    <thead className="text-slate-500 sticky top-0 z-10 bg-white shadow-sm">
                                    <tr>
                                        <th className="p-0 border border-slate-300 bg-slate-100" style={{ width: '2%' }}></th>
                                        <th className="p-0 bg-white border border-slate-300 shadow-sm text-center align-middle" style={{ width: '2.5%' }}> <div className="flex items-center justify-center h-full text-purple-500 opacity-80"> <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"></path></svg> </div> </th>
                                        <th className="p-2 text-[10px] font-bold bg-white border border-slate-300 shadow-sm text-center" style={{ width: '10%' }}>PERSONEL</th>
                                        {dayNames.map((d, i) => { const isToday = isCurrentWeek && (now.getDay() + 6) % 7 === i; return ( <th key={d} className={`p-1 text-center shadow-sm ${isToday ? 'bg-blue-50 text-blue-600 font-bold border-t border-b border-slate-300 border-l-2 border-r-2 border-l-blue-500 border-r-blue-500' : 'bg-white border border-slate-300'}`} style={{ width: '11.5%' }}> <div className="text-[10px] font-bold truncate">{d}</div> <span className="text-[9px] font-normal text-slate-400 block -mt-0.5">{fmtTR(addDays(weekStart, i)).substring(0, 5)}</span> </th> ); })}
                                        <th className="p-2 text-center text-[10px] font-bold bg-white border border-slate-300 shadow-sm" style={{ width: '4%' }}>TOP.</th>
                                    </tr>
                                </thead>
                                <tbody className="align-middle">
                                    {Object.entries(STAFF_TYPES).map(([typeKey, typeInfo]) => {
                                        const groupStaff = staff.filter(s => s.type === typeKey);
                                        if (groupStaff.length === 0) return null;
                                        let groupStyle = { bg: typeInfo.bg, text: typeInfo.color };
                                        if (typeKey === 'staff') { groupStyle = { bg: 'bg-blue-100', text: 'text-blue-800' }; } else if (typeKey === 'student') { groupStyle = { bg: 'bg-amber-100', text: 'text-amber-800' }; } else if (typeKey === 'iskur') { groupStyle = { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' }; }
                                        return groupStaff.map((s, index) => (
                                            <tr key={s.id} className={`group transition-all ${canReorder ? 'cursor-move hover:bg-slate-50' : ''}`} draggable={canReorder} onDragStart={(e) => handleDragStart(e, s.id)} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, s.id, typeKey)} style={{ minHeight: '50px' }}>
                                                {index === 0 && ( <td rowSpan={groupStaff.length} className={`p-0 border border-slate-300 text-center align-middle font-bold text-[10px] tracking-widest uppercase select-none ${groupStyle.bg} ${groupStyle.text}`} style={{ width: '2%', padding: 0, height: '1px' }}> <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', whiteSpace: 'nowrap' }}> {typeInfo.label} </div> </td> )}
                                                <td className="p-0 bg-white border border-slate-300 shadow-sm align-middle text-center" style={{ width: '2.5%', height: '1px' }}> {canEdit && ( <button onClick={(e) => { e.stopPropagation(); openWizard(s.id); }} className="w-full flex items-center justify-center text-slate-300 hover:text-purple-600 transition-all duration-200 hover:scale-110 active:scale-95" style={{ minHeight: '50px', height: '100%' }} title="Toplu Shift Sihirbaz\u0131"> <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"></path></svg> </button> )} </td>
                                                <td className="p-1 bg-white border border-slate-300 shadow-sm align-middle relative" style={{ color: s.color, width: '10%', height: '1px', position: 'sticky', left: 0, zIndex: 15, backgroundColor: '#ffffff' }}> {canReorder && (<div className="absolute top-0 left-0 w-3 h-3 flex items-center justify-center cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-20 text-slate-300 text-[10px] select-none">{'\u2630'}</div>)} <div className="flex flex-col justify-center w-full pl-2" style={{ minHeight: '50px', height: '100%' }}> <div className="font-bold text-[13px] leading-tight whitespace-normal break-words text-left">{s.name}</div> {canEdit && ( <div className="absolute top-1 left-1 flex flex-col gap-1 no-print opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 p-0.5 rounded"> <button onClick={(e) => { e.stopPropagation(); handleCopyWeek(s.id); }} className="w-5 h-5 bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white transition-colors border border-slate-200 flex items-center justify-center rounded" title="Kopyala"> <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> </button> {copiedWeek && ( <button onClick={(e) => { e.stopPropagation(); handlePasteWeek(s.id); }} className="w-5 h-5 bg-green-50 hover:bg-green-600 text-green-600 hover:text-white transition-colors border border-green-200 flex items-center justify-center rounded" title="Yap\u0131\u015Ft\u0131r"> <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> </button> )} </div> )} </div> </td>
                                                {dayNames.map((_, d) => { const isToday = isCurrentWeek && (now.getDay() + 6) % 7 === d; const dayShifts = shifts.filter(x => x.staffId === s.id && x.day === d); const hasShifts = dayShifts.length > 0; return ( <td key={d} className={`p-0 bg-white relative align-top shadow-sm border border-slate-300 ${isToday ? 'live-day-col' : ''}`} style={{ width: '11.5%', height: '1px' }}> <div className={`relative w-full ${canEdit ? 'cursor-pointer hover:bg-blue-50/50' : ''}`} onClick={() => canEdit && openEdit(s.id, d)} style={{ minHeight: '50px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'stretch' }} > <div className="w-full h-full flex flex-col text-[10px]"> {getShiftStr(s.id, d)} </div> {canEdit && ( <div className="absolute top-0 right-0 flex gap-0.5 no-print opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80 p-0.5 rounded-bl shadow-sm" onClick={(e) => e.stopPropagation()}> {hasShifts && (<button onClick={(e) => { e.stopPropagation(); handleCopyDay(s.id, d); }} className="w-4 h-4 bg-white hover:bg-blue-600 text-blue-600 hover:text-white shadow-sm border border-slate-200 flex items-center justify-center transition-colors rounded-sm" title="Kopyala"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>)} {copiedDay && (<button onClick={(e) => { e.stopPropagation(); handlePasteDay(s.id, d); }} className="w-4 h-4 bg-white hover:bg-green-600 text-green-600 hover:text-white shadow-sm border border-slate-200 flex items-center justify-center transition-colors rounded-sm" title="Yap\u0131\u015Ft\u0131r"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>)} </div> )} </div> </td> ); })}
                                                <td className={`p-1 text-center body-normal border border-slate-300 shadow-sm ${isBelowMinimum(s.id) ? 'bg-amber-100' : 'bg-slate-50'}`} style={{ width: '4%', height: '1px' }}>
                                                    <div className={`font-bold text-xs flex items-center justify-center gap-1 ${isBelowMinimum(s.id) ? 'text-amber-700' : 'text-slate-700'}`} style={{ minHeight: '50px', height: '100%' }} title={isBelowMinimum(s.id) ? 'Alt s\u0131n\u0131r\u0131n alt\u0131nda!' : ''}>
                                                        {isBelowMinimum(s.id) && <span className="text-amber-600">{'\u26A0\uFE0F'}</span>}
                                                        {totalHrs(s.id)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ));
                                    })}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </div>
                    {/* --- MOBIL KART GORUNUMU --- */}
                    <div className={`${mobileMode ==='table' ? 'hidden' : 'lg:hidden' } space-y-3 pb-2 print-hidden`}>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 mb-4 shadow-sm">
                            <div className="flex justify-between items-center gap-3">
                                <div className="flex items-center gap-2"><span className="text-2xl">{'\u{1F4C5}'}</span><div className="body-normal text-blue-900">{fmtTR(weekStart)} {'\u2014'} {fmtTR(addDays(weekStart, 6))}</div></div>
                                <button onClick={() => setMobileMode('table')} className="bg-white border-2 border-blue-600 text-blue-600 px-4 py-2.5 rounded-xl body-small shadow-md hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap">{'\u{1F4CB}'} Tablo G{'\u00F6'}r{'\u00FC'}n{'\u00FC'}m{'\u00FC'}ne Ge{'\u00E7'}</button>
                            </div>
                        </div>
                        {Object.entries(STAFF_TYPES).map(([typeKey, typeInfo]) => {
                        const groupStaff = staff.filter(s => s.type === typeKey);
                        if (groupStaff.length === 0) return null;
                        return (
                        <div key={typeKey} className="space-y-3">
                            <div className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest ${typeInfo.bg} ${typeInfo.color} border border-slate-100 mb-2`}>{typeInfo.label}</div>
                            {groupStaff.map(s => {
                            const isExp = expandedStaff === s.id;
                            return (
                            <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className={`p-4 flex justify-between items-center ${isExp ? 'bg-blue-50' : '' }`}>
                                    <div onClick={() => setExpandedStaff(isExp ? null : s.id)} className="flex items-center gap-3 flex-1 active-scale">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: s.color }}>{s.name.charAt(0)}</div>
                                        <div>
                                            <div className="body-normal text-slate-800">{s.name}</div>
                                            <div className={`caption flex items-center gap-1 ${isBelowMinimum(s.id) ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                                                {isBelowMinimum(s.id) && <span>{'\u26A0\uFE0F'}</span>}
                                                {totalHrs(s.id)} Saat
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {canEdit && (
                                        <div className="flex gap-1.5">
                                            <button onClick={(e) => { e.stopPropagation(); openWizard(s.id); }} className="p-2 rounded-lg bg-purple-50 hover:bg-purple-500 text-purple-600 hover:text-white transition-all duration-200 shadow-sm border border-purple-200 hover:border-purple-500 flex items-center justify-center" title="Sihirbaz"> <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleCopyWeek(s.id); }} className="p-2 rounded-lg bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white transition-all duration-200 shadow-sm border border-blue-200 hover:border-blue-500 flex items-center justify-center" title="T\u00FCm haftay\u0131 kopyala"> <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /> </svg> </button>
                                            {copiedWeek && (<button onClick={(e) => { e.stopPropagation(); handlePasteWeek(s.id); }} className="p-2 rounded-lg bg-green-50 hover:bg-green-500 text-green-600 hover:text-white transition-all duration-200 shadow-sm border border-green-200 hover:border-green-500 flex items-center justify-center" title="T\u00FCm haftay\u0131 yap\u0131\u015Ft\u0131r"> <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> </svg> </button>)}
                                        </div>
                                        )}
                                        <div onClick={() => setExpandedStaff(isExp ? null : s.id)} className={`text-slate-300 transform transition ${isExp ? 'rotate-180' : ''}`}>{'\u25BC'}</div>
                                    </div>
                                </div>
                                {isExp && ( <div className="divide-y divide-slate-100 bg-slate-50/50 border-t border-slate-100"> {mobileDays.map((d, i) => { const dayShifts = shifts.filter(x => x.staffId === s.id && x.day === i); const hasShifts = dayShifts.length > 0; return ( <div key={i} className="flex justify-between items-center border-b border-slate-100"> <div onClick={() => canEdit && openEdit(s.id, i)} className={`flex-1 p-3 pl-6 pr-4 flex justify-between items-center transition-colors ${canEdit ? 'active:bg-blue-50' : ''}`}> <div className="flex flex-col"><div className="label-normal text-slate-500">{d}</div><div className="caption-small text-slate-400">{fmtTR(addDays(weekStart, i))}</div></div> <div className="flex items-center gap-3" style={{ minWidth: '120px', maxWidth: '120px', width: '120px' }}>{getShiftStr(s.id, i)}</div> </div> {canEdit && ( <div className="flex flex-col gap-1 px-2"> {hasShifts && (<button onClick={(e) => { e.stopPropagation(); handleCopyDay(s.id, i); }} className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white transition-all duration-200 shadow-sm border border-blue-200 hover:border-blue-500 flex items-center justify-center" title="Bu g\u00FCn\u00FC kopyala"> <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /> </svg> </button>)} {copiedDay && (<button onClick={(e) => { e.stopPropagation(); handlePasteDay(s.id, i); }} className="p-1.5 rounded-md bg-green-50 hover:bg-green-500 text-green-600 hover:text-white transition-all duration-200 shadow-sm border border-green-200 hover:border-green-500 flex items-center justify-center" title="Bu g\u00FCne yap\u0131\u015Ft\u0131r"> <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> </svg> </button>)} </div> )} </div> ); })} </div> )}
                            </div>
                            );
                            })}
                        </div>
                        );
                        })}
                    </div>
                    {/* --- HAFTALIK NOT --- */}
                    {!isAdmin && !isManager && ( <div className="mt-6 bg-white rounded-2xl shadow p-4 border border-slate-100 no-print"> <h3 className="heading-tertiary border-b pb-2 mb-2 text-slate-600">{'\u{1F4DD}'} Haftal{'\u0131'}k Not</h3> <textarea className="w-full border rounded-lg p-2 body-small h-32 resize-none" placeholder="Notlar..." value={note} onChange={e => saveNote(e.target.value)} onBlur={pushNote} disabled={!canEdit}></textarea> </div> )}
                </div>
            </div>
            <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-2 flex justify-between items-center z-40 pb-safe print-hidden px-4"> <IconBtn icon={'\u25C0'} label={'\u00D6nceki'} onClick={() => setWeekStart(addDays(weekStart, -7))} /> <IconBtn icon={'\u25B6'} label="Sonraki" onClick={() => setWeekStart(addDays(weekStart, 7))} /> <IconBtn icon={'\u2709\uFE0F'} label="E-posta" onClick={() => setEmailOpen(true)} /> <IconBtn icon={'\u{1F517}'} label={'Payla\u015F'} onClick={handleShare} /> <IconBtn icon={'\u{1F6AA}'} label={'\u00C7\u0131k\u0131\u015F'} onClick={async ()=> { await api(API.AUTH_LOGOUT, { method: 'POST' }); window.location.href = 'index.html' }} /> </div>

            {/* --- MODAL PENCERELER --- */}
            <EmailModal isOpen={emailOpen} onClose={() => setEmailOpen(false)} form={emailForm} setForm={setEmailForm} onSend={sendEmail} sending={emailSending} />
            <ArchiveModal isOpen={archiveOpen} onClose={() => setArchiveOpen(false)} view={archiveView} setView={setArchiveView} list={archiveList} isAdmin={isAdmin} createArchive={createArchive} deleteArchive={deleteArchive} viewArchive={viewArchive} staff={staff} shifts={shifts} currentUnit={currentUnit} />
            <PDKSModal isOpen={pdksOpen} onClose={() => setPdksOpen(false)} data={pdksData} loading={pdksLoading} />

            <ShiftWizard
                isOpen={wizardOpen} onClose={() => setWizardOpen(false)}
                targetName={staff.find(s => s.id === wizardTarget)?.name}
                form={wizardForm} setForm={setWizardForm}
                templates={templates} showTemplateManager={showTemplateManager} setShowTemplateManager={setShowTemplateManager}
                newTemplate={newTemplate} setNewTemplate={setNewTemplate}
                editingTemplate={editingTemplate} setEditingTemplate={setEditingTemplate}
                onAddTemplate={handleAddTemplate} onUpdateTemplate={handleUpdateTemplate} onDeleteTemplate={handleDeleteTemplate}
                onReorderTemplates={loadTemplates}
                onApply={handleWizardApply}
                currentUnit={currentUnit}
                tasks={tasks}
            />

            <CellEditModal
                isOpen={!!cellEdit} onClose={() => setCellEdit(null)}
                cellEdit={cellEdit} setCellEdit={setCellEdit}
                staffName={staff.find(s => s.id === cellEdit?.staffId)?.name}
                onSave={handleShiftSave}
                templates={templates} showTemplateManager={showTemplateManager} setShowTemplateManager={setShowTemplateManager}
                newTemplate={newTemplate} setNewTemplate={setNewTemplate}
                editingTemplate={editingTemplate} setEditingTemplate={setEditingTemplate}
                onAddTemplate={handleAddTemplate} onUpdateTemplate={handleUpdateTemplate} onDeleteTemplate={handleDeleteTemplate}
                onReorderTemplates={loadTemplates}
                currentUnit={currentUnit}
                tasks={tasks}
                currentUser={currentUser}
                leaveStartDate={leaveStartDate} setLeaveStartDate={setLeaveStartDate}
                leaveEndDate={leaveEndDate} setLeaveEndDate={setLeaveEndDate}
                leaveStartTime={leaveStartTime} setLeaveStartTime={setLeaveStartTime}
                leaveEndTime={leaveEndTime} setLeaveEndTime={setLeaveEndTime}
                minDateLimit={minDateLimit}
                toast={toast} timeToMin={timeToMin}
            />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
