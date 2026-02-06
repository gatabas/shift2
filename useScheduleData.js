/* useScheduleData.js - Haftalik veri, staff, shift, not ve fitness verileri */

window.useScheduleData = function useScheduleData(currentUnit, currentUser, units, weekISO, weekStart, toast) {
    const { useState, useEffect, useCallback } = React;

    const [staff, setStaff] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [note, setNote] = useState("");
    const [templates, setTemplates] = useState([]);
    const [tasks, setTasks] = useState([]);

    // Fitness combined data
    const [allFitnessShifts, setAllFitnessShifts] = useState([]);
    const [allFitnessStaff, setAllFitnessStaff] = useState([]);

    const loadData = useCallback(async () => {
        if (!currentUnit) return;
        try {
            const [sData, wData, tData, taskData] = await Promise.all([
                api(`${API.STAFF}?unit=${currentUnit.id}`),
                api(`${API.WEEK_DATA}?unit=${currentUnit.id}&weekISO=${weekISO}`),
                api(`${API.TEMPLATES}?unit=${currentUnit.id}`),
                api(`${API.TASKS}?unit=${currentUnit.id}`)
            ]);

            console.log('\u{1F4E5} API Tasks Response:', taskData);
            console.log('\u{1F4E5} Current Unit:', currentUnit);

            setTemplates(tData || []);
            setTasks(taskData || []);

            console.log('\u2705 Tasks set to state:', taskData || []);
            setStaff(sData.map(s => ({ id: s.ID, name: s.AD_SOYAD, color: s.RENK || '#000', type: s.PERSONEL_TIPI || 'staff', order: (s.SIRALAMA !== null && s.SIRALAMA !== undefined) ? s.SIRALAMA : 9999 })).sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name)));
            const processedShifts = wData.shifts.map(s => { const shift = { id: s.ID, staffId: s.PERSONEL_ID, day: s.GUN, start: s.BASLANGIC, end: s.BITIS, tag: s.ETIKET, task: s.GOREV }; return shift; });
            setShifts(processedShifts);
            setNote(wData.note || "");
        } catch (e) { toast.show("Veri y\u00FCklenemedi: " + e.message, true); }
    }, [currentUnit, weekISO]);

    // Fitness user: load both units
    useEffect(() => {
        const loadFitnessData = async () => {
            if (currentUser?.username !== 'fitness') return;
            if (!units || units.length === 0) return;

            try {
                const technoGym = units.find(u => u.name === 'Technogym Fitness');
                const genelFitness = units.find(u => u.name === 'Genel Fitness');

                if (!technoGym && !genelFitness) return;

                const promises = [];
                const unitIds = [];

                if (technoGym) {
                    promises.push(api(`${API.WEEK_DATA}?unit=${technoGym.id}&weekISO=${weekISO}`));
                    promises.push(api(`${API.STAFF}?unit=${technoGym.id}`));
                    unitIds.push({ id: technoGym.id, name: technoGym.name });
                }

                if (genelFitness) {
                    promises.push(api(`${API.WEEK_DATA}?unit=${genelFitness.id}&weekISO=${weekISO}`));
                    promises.push(api(`${API.STAFF}?unit=${genelFitness.id}`));
                    unitIds.push({ id: genelFitness.id, name: genelFitness.name });
                }

                const results = await Promise.all(promises);

                let combinedShifts = [];
                let combinedStaff = [];

                if (technoGym && genelFitness) {
                    const [technoData, technoStaff, genelData, genelStaff] = results;
                    combinedShifts = [
                        ...technoData.shifts.map(s => ({ ...s, unitName: 'Technogym Fitness' })),
                        ...genelData.shifts.map(s => ({ ...s, unitName: 'Genel Fitness' }))
                    ];
                    combinedStaff = [
                        ...technoStaff.map(s => ({ ...s, unitName: 'Technogym Fitness' })),
                        ...genelStaff.map(s => ({ ...s, unitName: 'Genel Fitness' }))
                    ];
                } else if (technoGym) {
                    const [technoData, technoStaff] = results;
                    combinedShifts = technoData.shifts.map(s => ({ ...s, unitName: 'Technogym Fitness' }));
                    combinedStaff = technoStaff.map(s => ({ ...s, unitName: 'Technogym Fitness' }));
                } else {
                    const [genelData, genelStaff] = results;
                    combinedShifts = genelData.shifts.map(s => ({ ...s, unitName: 'Genel Fitness' }));
                    combinedStaff = genelStaff.map(s => ({ ...s, unitName: 'Genel Fitness' }));
                }

                const processedShifts = combinedShifts.map(s => ({
                    id: s.ID,
                    staffId: s.PERSONEL_ID,
                    day: s.GUN,
                    start: s.BASLANGIC,
                    end: s.BITIS,
                    tag: s.ETIKET,
                    task: s.GOREV,
                    unitName: s.unitName
                }));

                const processedStaff = combinedStaff.map(s => ({
                    id: s.ID,
                    name: s.AD_SOYAD,
                    color: s.RENK || '#000',
                    type: s.PERSONEL_TIPI || 'staff',
                    unitName: s.unitName
                }));

                setAllFitnessShifts(processedShifts);
                setAllFitnessStaff(processedStaff);
            } catch (e) {
                console.error('Fitness verileri y\u00FCklenemedi:', e);
            }
        };

        loadFitnessData();
    }, [currentUser, units, weekISO]);

    useEffect(() => { loadData() }, [loadData]);

    return {
        staff, setStaff,
        shifts, setShifts,
        note, setNote,
        templates, setTemplates,
        tasks, setTasks,
        allFitnessShifts, allFitnessStaff,
        loadData
    };
};
