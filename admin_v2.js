/* public/js/admin.js */

console.log('🚀 Admin Panel Ready');

// DOM Elemanları
const form = document.getElementById('userForm');
const msg = document.getElementById('msg');
const btnAdd = document.getElementById('btnAdd');
const fUser = document.getElementById('fUser');
const fFirst = document.getElementById('fFirst');
const fLast = document.getElementById('fLast');
const fPass = document.getElementById('fPass');
const fRole = document.getElementById('fRole');
const unitCheckContainer = document.getElementById('unitCheckboxes'); // Select yerine Div
const editIdInput = document.getElementById('editUserId');
const formTitle = document.getElementById('formTitle');
const btnCancel = document.getElementById('btnCancelEdit');
const passHint = document.getElementById('passHint');

// Birim Yönetimi Elemanları
const unitForm = document.getElementById('unitForm');
const unitList = document.getElementById('unitList');
const newUnitName = document.getElementById('newUnitName');
const btnSaveUnitOrder = document.getElementById('btnSaveUnitOrder');

let me = null, allUsers = [];
let unitDragSrcEl = null;

// Yardımcı Fonksiyon: Baş harf ve Renk Üretici
function getAvatar(first, last) {
    const f = (first || '?').charAt(0).toUpperCase();
    const l = (last || '').charAt(0).toUpperCase();
    const colors = ['bg-red-100 text-red-600', 'bg-orange-100 text-orange-600', 'bg-amber-100 text-amber-600', 'bg-green-100 text-green-600', 'bg-emerald-100 text-emerald-600', 'bg-teal-100 text-teal-600', 'bg-cyan-100 text-cyan-600', 'bg-sky-100 text-sky-600', 'bg-blue-100 text-blue-600', 'bg-indigo-100 text-indigo-600', 'bg-violet-100 text-violet-600', 'bg-purple-100 text-purple-600', 'bg-fuchsia-100 text-fuchsia-600', 'bg-pink-100 text-pink-600', 'bg-rose-100 text-rose-600'];
    const hash = (f + l).charCodeAt(0) % colors.length;
    return { text: f + l, class: colors[hash] };
}

// API Yardımcısı
async function api(path, opts = {}) {
    let p = path.startsWith('/') ? path.slice(1) : path;
    if (!p.startsWith('shift/')) p = 'shift/' + p;
    try {
        const r = await fetch('/' + p, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, ...opts });
        if (!r.ok) { let m = `Hata:${r.status}`; try { const j = await r.json(); m = j.message || m } catch { } throw new Error(m) } return await r.json()
    } catch (e) { console.error(e); throw e }
}

async function loadMe() {
    try {
        me = await api(API.AUTH_ME);
        if (me.role !== 'admin') document.body.innerHTML = '<div class="h-screen flex items-center justify-center bg-slate-50"><div class="text-center"><h1 class="text-4xl font-bold text-slate-800 mb-2">403</h1><p class="text-slate-500">Bu sayfaya erişim yetkiniz yok.</p></div></div>';
    } catch { window.location.href = 'index.html' }
}

/* ---------- BİRİM YÖNETİMİ & SIRALAMA ---------- */
async function loadUnitsAdmin() {
    try {
        const units = await api(API.UNITS);

        if (units.length === 0) {
            unitList.innerHTML = '<div class="w-full text-center text-xs text-slate-400 py-2 italic">Kayıtlı birim yok.</div>';
        } else {
            // Liste Elemanlarını Oluştur
            unitList.innerHTML = units.map(u => `
                <li draggable="true" data-id="${u.dbId}" class="draggable-item flex items-center justify-between bg-white hover:bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-sky-300 transition-all shadow-sm group select-none">
                    <div class="flex items-center gap-3">
                        <div class="cursor-move text-slate-300 hover:text-sky-500 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </div>
                        <span class="text-sm font-bold text-slate-700">${u.name}</span>
                    </div>
                    <button type="button" onclick="delUnit(${u.dbId})" class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </li>
            `).join('');

            setupDragAndDrop();
        }

        // Selectbox güncelle
       if (unitCheckContainer) {
        unitCheckContainer.innerHTML = units.map(u => `
            <label class="flex items-center gap-2 cursor-pointer hover:bg-slate-200 p-1 rounded">
                <input type="checkbox" name="unitCheck" value="${u.name}" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-sm text-slate-700 select-none">${u.name}</span>
            </label>
        `).join('');
    }

        btnSaveUnitOrder.classList.add('hidden'); // Reset

    } catch (e) {
        console.error("Birimler yüklenemedi", e);
        unitList.innerHTML = '<div class="text-center text-xs text-red-400">Hata oluştu.</div>';
    }
}

function setupDragAndDrop() {
    const items = unitList.querySelectorAll('li');
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    this.style.opacity = '0.4';
    unitDragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    return false;
}

function handleDragEnter(e) {
    this.classList.add('border-sky-500', 'bg-sky-50');
}

function handleDragLeave(e) {
    this.classList.remove('border-sky-500', 'bg-sky-50');
}

function handleDrop(e) {
    e.stopPropagation();
    if (unitDragSrcEl !== this) {
        // DOM yer değişimi
        const list = unitList;
        const items = [...list.children];
        const srcIndex = items.indexOf(unitDragSrcEl);
        const targetIndex = items.indexOf(this);

        if (srcIndex < targetIndex) {
            this.after(unitDragSrcEl);
        } else {
            this.before(unitDragSrcEl);
        }

        // Butonu Göster
        btnSaveUnitOrder.classList.remove('hidden');
    }
    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    unitList.querySelectorAll('li').forEach(item => {
        item.classList.remove('border-sky-500', 'bg-sky-50', 'dragging');
    });
}

async function saveUnitOrder() {
    const items = unitList.querySelectorAll('li');
    const orderData = [];
    items.forEach((item, index) => {
        orderData.push({
            id: parseInt(item.getAttribute('data-id')), // DB ID
            siralama: index + 1 // 1'den başla
        });
    });

    const btnText = btnSaveUnitOrder.innerText;
    btnSaveUnitOrder.innerText = '...';

    try {
        await api(API.UNITS_REORDER, {
            method: 'POST',
            body: JSON.stringify({ units: orderData })
        });
        btnSaveUnitOrder.classList.add('hidden');
        loadUnitsAdmin(); // Listeyi tazele
    } catch (e) {
        alert('Sıralama kaydedilemedi: ' + e.message);
    } finally {
        btnSaveUnitOrder.innerText = btnText;
    }
}

unitForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = newUnitName.value.trim().toUpperCase();
    if (!name) return;
    try {
        await api(API.UNITS, { method: 'POST', body: JSON.stringify({ name }) });
        newUnitName.value = '';
        loadUnitsAdmin();
    } catch (e) { alert(e.message); }
});

window.delUnit = async (dbId) => {
    if (!confirm("Bu birimi silmek istediğine emin misin?")) return;
    try {
        await api(`${API.UNITS}/${dbId}`, { method: 'DELETE' });
        loadUnitsAdmin();
    } catch (e) { alert(e.message); }
};

/* ---------- KULLANICI YÖNETİMİ ---------- */
async function loadUsers() {
    const box = document.getElementById('usersBox');
    try {
        const d = await api(API.ADMIN_USERS); allUsers = d || [];
        if (!allUsers.length) { box.innerHTML = '<div class="flex flex-col items-center justify-center p-10 h-64 text-slate-400 gap-2"><svg class="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg><span>Henüz kayıtlı kullanıcı yok.</span></div>'; return; }

        let html = `
        <div class="hidden sm:block overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-slate-200 bg-slate-50/50">
                        <th class="p-4 pl-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Personel</th>
                        <th class="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kullanıcı Adı</th>
                        <th class="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                        <th class="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Birim</th>
                        <th class="p-4 pr-6 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">İşlemler</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                    ${allUsers.map(u => rowHtml(u)).join('')}
                </tbody>
            </table>
        </div>
        <div class="sm:hidden grid grid-cols-1 gap-4 p-4 bg-slate-50">
            ${allUsers.map(u => cardHtml(u)).join('')}
        </div>`;
        box.innerHTML = html;
    } catch (e) { box.innerHTML = `<div class="p-6 text-center text-red-500 font-medium">${e.message}</div>` }
}

const rowHtml = u => {
    const av = getAvatar(u.first_name, u.last_name);
    return `
    <tr class="group hover:bg-slate-50/80 transition-colors">
        <td class="p-4 pl-6">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full ${av.class} flex items-center justify-center text-xs font-bold border border-white shadow-sm">${av.text}</div>
                <div>
                    <div class="font-bold text-slate-800 text-sm">${u.first_name || ''} ${u.last_name || ''}</div>
                </div>
            </div>
        </td>
        <td class="p-4">
            <span class="text-slate-500 font-mono text-xs bg-slate-100 px-2 py-1 rounded-md border border-slate-200">@${u.username}</span>
        </td>
        <td class="p-4">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-sky-50 text-sky-700 border-sky-100'}">
                ${u.role === 'admin' ? '<span class="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></span>' : ''}
                ${u.role}
            </span>
        </td>
        <td class="p-4">
            <span class="text-xs font-semibold text-slate-600">${u.department || '<span class="text-slate-300">-</span>'}</span>
        </td>
        <td class="p-4 pr-6 text-right">
            <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="startEdit('${u.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Düzenle">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onclick="delUser('${u.id}')" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        </td>
    </tr>`;
};

const cardHtml = u => {
    const av = getAvatar(u.first_name, u.last_name);
    return `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full ${av.class} flex items-center justify-center text-xs font-bold shadow-sm">${av.text}</div>
            <div>
                <div class="font-bold text-slate-800 text-sm">${u.first_name || ''} ${u.last_name || ''}</div>
                <div class="text-[11px] text-slate-400 font-mono">@${u.username}</div>
                <div class="flex gap-2 mt-1">
                    <span class="text-[9px] font-bold uppercase tracking-wider text-slate-500">${u.role}</span>
                    ${u.department ? `<span class="text-[9px] font-bold text-slate-300">•</span><span class="text-[9px] font-bold uppercase tracking-wider text-slate-500">${u.department}</span>` : ''}
                </div>
            </div>
        </div>
        <div class="flex gap-1">
            <button onclick="startEdit('${u.id}')" class="active-shrink bg-slate-50 text-blue-600 p-2 rounded-lg border border-slate-100 shadow-sm"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
            <button onclick="delUser('${u.id}')" class="active-shrink bg-slate-50 text-red-600 p-2 rounded-lg border border-slate-100 shadow-sm"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
        </div>
    </div>`;
};

window.startEdit = function (id) {
    const u = allUsers.find(x => x.id === id); if (!u) return;
    editIdInput.value = u.id;
    fUser.value = u.username;
    fRole.value = u.role;
    fFirst.value = u.first_name || "";
    fLast.value = u.last_name || "";

    // Checkboxları işaretle
const userUnits = (u.department || "").split(','); // Virgülle ayır
const checkboxes = document.querySelectorAll('input[name="unitCheck"]');
checkboxes.forEach(cb => {
    cb.checked = userUnits.includes(cb.value);
});

    fPass.value = ""; fPass.required = false;
    formTitle.textContent = "Kullanıcıyı Düzenle";
    // Button Style Change
    btnAdd.innerHTML = `<span>Güncelle</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`;
    btnAdd.className = "active-shrink group w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 mt-2 flex items-center justify-center gap-2 transition-all";

    btnCancel.classList.remove('hidden');
    passHint.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Highlight effect
    document.getElementById('userForm').parentElement.parentElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
    setTimeout(() => document.getElementById('userForm').parentElement.parentElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'), 1000);
};

window.cancelEdit = function () {
    form.reset(); editIdInput.value = "";
    formTitle.textContent = "Kullanıcı Ekle";
    btnAdd.innerHTML = `<span>Kaydet</span><svg class="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>`;
    btnAdd.className = "active-shrink group w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 mt-2 flex items-center justify-center gap-2 transition-all";
    btnCancel.classList.add('hidden'); passHint.classList.add('hidden'); fPass.required = true;
};

form.addEventListener('submit', async (e) => {
    e.preventDefault(); const eid = editIdInput.value;
    const selectedCheckboxes = Array.from(document.querySelectorAll('input[name="unitCheck"]:checked'));
const selectedDept = selectedCheckboxes.map(cb => cb.value).join(',');
    const p = { username: fUser.value.trim(), password: fPass.value, role: fRole.value, department: selectedDept, first_name: fFirst.value.trim(), last_name: fLast.value.trim() };

    const originalBtnText = btnAdd.innerHTML;
    btnAdd.disabled = true; btnAdd.innerHTML = '<svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

    try {
        await api(eid ? `${API.ADMIN_USERS}/${eid}` : API.ADMIN_USERS, { method: eid ? 'PUT' : 'POST', body: JSON.stringify(p) });
        msg.className = 'text-green-600 mt-2 font-bold'; msg.innerText = 'İşlem Başarılı!'; cancelEdit(); loadUsers();
    } catch (err) { msg.className = 'text-red-500 mt-2 font-bold'; msg.innerText = err.message; }
    finally { btnAdd.disabled = false; btnAdd.innerHTML = originalBtnText; setTimeout(() => msg.innerText = '', 3000); }
});

window.delUser = async (id) => { if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return; try { await api(`${API.ADMIN_USERS}/${id}`, { method: 'DELETE' }); loadUsers(); } catch (e) { alert(e.message); } };

// Başlangıç Fonksiyonları
(async () => {
    await loadMe();
    await loadUnitsAdmin();
    await loadUsers();
})();
// =====================
// GÖREV YÖNETİMİ
// =====================

let currentTaskUnit = null;
let currentTasks = [];

async function loadTasksForUnit() {
    const select = document.getElementById('taskUnitSelect');
    const unitId = select.value;
    const area = document.getElementById('taskManagementArea');
    
    if (!unitId) {
        area.classList.add('hidden');
        return;
    }
    
    currentTaskUnit = unitId;
    area.classList.remove('hidden');
    
    try {
        const tasks = await api(`${API.TASKS}?unit=${unitId}`);
        currentTasks = tasks;
        renderTasks();
    } catch (e) {
        console.error('Görevler yüklenemedi:', e);
    }
}

function renderTasks() {
    const list = document.getElementById('taskList');
    
    if (currentTasks.length === 0) {
        list.innerHTML = '<div class="text-center text-xs text-slate-400 py-4">Görev yok</div>';
        return;
    }
    
    list.innerHTML = currentTasks.map(task => `
        <div class="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200 transition group">
            <div class="flex-1 text-xs font-medium text-slate-700">${task.name}</div>
            <button onclick="editTask(${task.ID})" class="opacity-0 group-hover:opacity-100 w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center transition">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
            <button onclick="deleteTask(${task.ID})" class="opacity-0 group-hover:opacity-100 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center transition">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        </div>
    `).join('');
}

document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const taskId = document.getElementById('editTaskId').value;
    const name = document.getElementById('taskName').value.trim();
    
    if (!name || !currentTaskUnit) return;
    
    try {
        if (taskId) {
            await api(API.TASKS + '/' + taskId, {
                method: 'PUT',
                body: JSON.stringify({ name, order: 999 })
            });
        } else {
            await api(API.TASKS, {
                method: 'POST',
                body: JSON.stringify({ 
                    unitId: parseInt(currentTaskUnit), 
                    name, 
                    order: currentTasks.length + 1 
                })
            });
        }
        
        document.getElementById('taskForm').reset();
        document.getElementById('editTaskId').value = '';
        loadTasksForUnit();
    } catch (e) {
        alert('Hata: ' + e.message);
    }
});

function editTask(id) {
    const task = currentTasks.find(t => t.ID === id);
    if (!task) return;
    
    document.getElementById('editTaskId').value = id;
    document.getElementById('taskName').value = task.name;
}

async function deleteTask(id) {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return;
    try {
        await api(API.TASKS + '/' + id, { method: 'DELETE' });
        loadTasksForUnit();
    } catch (e) {
        alert('Hata: ' + e.message);
    }
}

async function populateTaskUnitSelect() {
    const select = document.getElementById('taskUnitSelect');
    try {
        const units = await api(API.UNITS);
        select.innerHTML = '<option value="">Birim seçin...</option>' + 
            units.map(u => `<option value="${u.dbId}">${u.name}</option>`).join('');
    } catch (e) {
        console.error('Birimler yüklenemedi:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    populateTaskUnitSelect();
});