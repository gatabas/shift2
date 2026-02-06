/* useTemplates.js - Sablon CRUD islemleri */

window.useTemplates = function useTemplates(currentUnit, loadData, toast) {
    const { useState } = React;

    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ label: '', start: '', end: '', task: '' });
    const [editingTemplate, setEditingTemplate] = useState(null);

    const handleAddTemplate = async () => {
        if (!newTemplate.label || !newTemplate.start || !newTemplate.end || !newTemplate.task) {
            toast.show("L\u00FCtfen g\u00F6rev dahil t\u00FCm alanlar\u0131 doldurun!", true);
            return;
        }
        try {
            await api(API.TEMPLATES, { method: 'POST', body: JSON.stringify({ unit: currentUnit.id, ...newTemplate }) });
            setNewTemplate({ label: '', start: '', end: '', task: '' });
            loadData();
            toast.show("\u015Eablon eklendi");
        } catch (e) { toast.show("Hata", true); }
    };

    const handleDeleteTemplate = async (id) => {
        if (!confirm("Bu \u015Fablon silinsin mi?")) return;
        try {
            await api(`${API.TEMPLATES}/${id}`, { method: 'DELETE' });
            loadData();
            toast.show("\u015Eablon silindi");
        } catch (e) { toast.show("Hata", true); }
    };

    const loadTemplates = async () => {
        if (!currentUnit) return;
        try {
            const tData = await api(`${API.TEMPLATES}?unit=${currentUnit.id}`);
            // Note: this reloads templates locally; caller may also call loadData
            return tData || [];
        } catch (e) {
            console.error('Template y\u00FCkleme hatas\u0131:', e);
        }
    };

    const handleUpdateTemplate = async () => {
        if (!editingTemplate.BASLIK || !editingTemplate.BASLANGIC || !editingTemplate.BITIS) {
            toast.show("L\u00FCtfen t\u00FCm alanlar\u0131 doldurun!", true);
            return;
        }
        try {
            await api(`${API.TEMPLATES}/${editingTemplate.ID}`, {
                method: 'PUT',
                body: JSON.stringify({
                    unit: currentUnit.id,
                    label: editingTemplate.BASLIK,
                    start: editingTemplate.BASLANGIC,
                    end: editingTemplate.BITIS,
                    task: editingTemplate.GOREV || ''
                })
            });
            setEditingTemplate(null);
            loadData();
            toast.show("\u015Eablon g\u00FCncellendi");
        } catch (e) {
            console.error(e);
            toast.show("\u0130\u015Flem ba\u015Far\u0131s\u0131z oldu", true);
        }
    };

    return {
        showTemplateManager, setShowTemplateManager,
        newTemplate, setNewTemplate,
        editingTemplate, setEditingTemplate,
        handleAddTemplate, handleDeleteTemplate, handleUpdateTemplate,
        loadTemplates
    };
};
