/* useArchive.js - Arsiv CRUD islemleri */

window.useArchive = function useArchive(currentUnit, shifts, note, staff, weekStart, weekISO, toast) {
    const { useState } = React;

    const [archiveOpen, setArchiveOpen] = useState(false);
    const [archiveList, setArchiveList] = useState([]);
    const [archiveView, setArchiveView] = useState(null);

    const openArchive = async () => {
        setArchiveOpen(true);
        setArchiveView(null);
        try {
            const list = await api(`${API.ARCHIVE}?unit=${currentUnit.id}`);
            setArchiveList(list || []);
        } catch (e) { toast.show("Liste al\u0131namad\u0131", true); }
    };

    const createArchive = async () => {
        if (!confirm("Ar\u015Fivlensin mi?")) return;
        const data = { shifts, note };
        const label = `${fmtTR(weekStart)} - ${fmtTR(addDays(weekStart, 6))} \u2022 ${currentUnit.name}`;
        try {
            await api(API.ARCHIVE, { method: 'POST', body: JSON.stringify({ unit: currentUnit.id, weekISO, label, data }) });
            toast.show("Ar\u015Fivlendi!");
            openArchive();
        } catch (e) { toast.show(e.message, true); }
    };

    const viewArchive = async (id) => {
        try {
            const detail = await api(`${API.ARCHIVE}/${id}`);
            setArchiveView(detail);
        } catch (e) { toast.show("Hata", true); }
    };

    const deleteArchive = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Bu ar\u015Fiv kayd\u0131 kal\u0131c\u0131 olarak S\u0130L\u0130NECEK. Emin misiniz?")) return;
        try {
            await api(`${API.ARCHIVE}/${id}`, { method: 'DELETE' });
            toast.show("Ar\u015Fiv ba\u015Far\u0131yla silindi");
            const list = await api(`${API.ARCHIVE}?unit=${currentUnit.id}`);
            setArchiveList(list || []);
        } catch (err) { toast.show("Silinemedi: " + err.message, true); }
    };

    return {
        archiveOpen, setArchiveOpen,
        archiveList, archiveView, setArchiveView,
        openArchive, createArchive, viewArchive, deleteArchive
    };
};
