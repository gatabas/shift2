/* useAuth.js - Kimlik dogrulama ve yetkilendirme hook'u */

window.useAuth = function useAuth() {
    const { useState, useEffect, useMemo } = React;

    const [currentUser, setCurrentUser] = useState(null);
    const [units, setUnits] = useState([]);
    const [currentUnit, setCurrentUnit] = useState(null);

    const isAdmin = currentUser?.role === 'admin';
    const isManager = currentUser?.role === 'manager';

    const availableUnits = useMemo(() => {
        if (!units.length) return [];
        if (!currentUser) return [];
        if (isAdmin || isManager) return units;
        const myDepts = (currentUser.department || "").split(',').map(d => d.trim().toUpperCase().replace(/\u0130/g, 'I').replace(/I/g, '\u0130'));
        return units.filter(u => {
            const unitNameNormalized = u.name.toUpperCase().replace(/\u0130/g, 'I').replace(/I/g, '\u0130');
            return myDepts.some(dept => unitNameNormalized.includes(dept) || dept.includes(unitNameNormalized));
        });
    }, [units, currentUser, isAdmin, isManager]);

    // Initial auth + units fetch
    useEffect(() => {
        Promise.all([api(API.AUTH_ME), api(API.UNITS)]).then(([u, fetchedUnits]) => {
            setCurrentUser(u);
            const allUnits = fetchedUnits.length > 0 ? fetchedUnits : [{ id: 'Genel', name: 'Genel' }];
            setUnits(allUnits);
            let myUnit;
            if (u.role === 'admin' || u.role === 'manager') { myUnit = allUnits[0]; } else {
                const myDepts = (u.department || "").split(',').map(d => d.trim().toUpperCase().replace(/\u0130/g, 'I').replace(/I/g, '\u0130'));
                myUnit = allUnits.find(unit => { const unitNameNormalized = unit.name.toUpperCase().replace(/\u0130/g, 'I').replace(/I/g, '\u0130'); return myDepts.some(dept => unitNameNormalized.includes(dept) || dept.includes(unitNameNormalized)); }) || allUnits[0];
            }
            setCurrentUnit(myUnit);
        }).catch(() => window.location.href = 'index.html');
    }, []);

    return {
        currentUser, setCurrentUser,
        units, setUnits,
        currentUnit, setCurrentUnit,
        isAdmin, isManager,
        availableUnits
    };
};
