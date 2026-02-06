/* usePdks.js - PDKS karsilastirma islemleri */

window.usePdks = function usePdks(currentUnit, weekISO, toast) {
    const { useState } = React;

    const [pdksOpen, setPdksOpen] = useState(false);
    const [pdksData, setPdksData] = useState(null);
    const [pdksLoading, setPdksLoading] = useState(false);

    const loadPDKSComparison = async () => {
        setPdksLoading(true);
        setPdksOpen(true);
        try {
            const data = await api(`${API.PDKS_COMPARE}?unit=${currentUnit.id}&weekISO=${weekISO}`);
            setPdksData(data);
            toast.show(`\u2705 PDKS verileri y\u00FCklendi (${data.summary.total} kay\u0131t)`);
        } catch (e) {
            toast.show('PDKS verileri al\u0131namad\u0131: ' + e.message, true);
            setPdksData(null);
        } finally { setPdksLoading(false); }
    };

    return {
        pdksOpen, setPdksOpen,
        pdksData, pdksLoading,
        loadPDKSComparison
    };
};
