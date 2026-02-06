/* useEmail.js - E-posta gonderme, Excel indirme ve PDF paylasim */

window.useEmail = function useEmail(currentUnit, staff, shifts, note, weekStart, weekISO, toast) {
    const { useState } = React;

    const [emailOpen, setEmailOpen] = useState(false);
    const [emailForm, setEmailForm] = useState({ recipients: '', subject: '', note: 'Merhaba,\nEkteki shift program\u0131n\u0131 bilgilerinize sunar\u0131m.', includeExcel: true });
    const [emailSending, setEmailSending] = useState(false);

    const sendEmail = async () => {
        const recipients = emailForm.recipients.split(/[\s,;]+/).filter(e => e.includes('@'));
        if (recipients.length === 0) { toast.show("Ge\u00E7erli e-posta girin", true); return; }
        setEmailSending(true);
        try {
            let tableHtml = `<h3>${currentUnit.name} - ${fmtTR(weekStart)} Haftas\u0131</h3>`;
            tableHtml += `<table border="1" style="border-collapse:collapse; width:100%; font-family:Arial, sans-serif; font-size:12px;"> <thead style="background-color:#f8f9fa;"> <tr> <th style="padding:8px;">AD SOYAD</th>`;
            dayNames.forEach(d => { tableHtml += `<th style="padding:8px; text-align:center;">${d}</th>`; });
            tableHtml += `<th style="padding:8px;">TOPLAM</th> </tr> </thead> <tbody>`;
            staff.forEach(s => {
                tableHtml += `<tr> <td style="padding:8px; font-weight:bold;">${s.name}</td>`;
                dayNames.forEach((_, i) => {
                    const shList = shifts.filter(x => x.staffId === s.id && x.day === i).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
                    let style = "text-align:center; padding:8px;";
                    let content = "";
                    if (shList.some(x => x.tag === 'YILLIK')) { content = "YILLIK \u0130Z\u0130N"; style += "color:red; font-weight:bold; background-color:#fff1f2;"; }
                    else if (shList.length > 0) { content = shList.map(x => `<div><strong>${(x.task || '')}</strong><br />${x.start}-${x.end}</div>`).join('<hr style="margin:4px 0; border:0; border-top:1px solid #eee;" />'); }
                    tableHtml += `<td style="${style}">${content}</td>`;
                });
                const total = shifts.filter(x => x.staffId === s.id).reduce((a, b) => a + minDiff(b.start, b.end), 0);
                tableHtml += `<td style="text-align:center; font-weight:bold; background-color:#f8f9fa;">${(total / 60).toFixed(0)}</td> </tr>`;
            });
            tableHtml += `</tbody></table>`;
            if (note) tableHtml += `<br /><div style="border:1px solid #ddd; padding:10px; background-color:#fff8e1;"><strong>NOTLAR:</strong><br />${note.replace(/\n/g, '<br />')}</div>`;
            if (emailForm.note) tableHtml += `<br /><p>${emailForm.note.replace(/\n/g, '<br />')}</p>`;
            await api(API.MAIL_SEND, { method: 'POST', body: JSON.stringify({ to: recipients, subject: emailForm.subject, html: tableHtml, attachExcel: emailForm.includeExcel }) });
            toast.show("E-posta g\u00F6nderildi!");
            setEmailOpen(false);
        } catch (e) { toast.show("Hata: " + e.message, true); }
        finally { setEmailSending(false); }
    };

    const downloadExcel = () => {
        let csv = "\ufeffAD SOYAD;";
        dayNames.forEach(d => csv += d + ";");
        csv += "TOPLAM\n";
        staff.forEach(s => {
            csv += `"${s.name}";`;
            dayNames.forEach((_, i) => {
                const sh = shifts.filter(x => x.staffId === s.id && x.day === i);
                if (sh.some(x => x.tag === 'YILLIK')) csv += "YILLIK \u0130Z\u0130N;";
                else if (sh.length > 0) { let str = sh.map(x => `${x.start}-${x.end} (${x.task || ''})`).join(' | '); csv += `"${str}";`; }
                else csv += ";";
            });
            const total = shifts.filter(x => x.staffId === s.id).reduce((a, b) => a + minDiff(b.start, b.end), 0);
            csv += `${(total / 60).toFixed(0)}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Vardiya_${currentUnit?.name}_${weekISO}.csv`;
        link.click();
    };

    const handleShare = async () => {
        if (!currentUnit) return;
        const title = `PA\u00DC Spor Merkezi \u2022 ${currentUnit.name} Shift (${fmtTR(weekStart)} - ${fmtTR(addDays(weekStart, 6))})`;
        toast.show('PDF haz\u0131rlan\u0131yor...');
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape', 'mm', 'a4');
            doc.setFontSize(16); doc.setFont(undefined, 'bold');
            doc.text(title, 148, 15, { align: 'center' });
            const startX = 45; const colWidth = 31; const totalHeaderX = startX + (7 * colWidth);
            let y = 30; const rowHeight = 12;
            doc.setFontSize(9); doc.setFont(undefined, 'bold');
            doc.text('Personel', 10, y);
            mobileDays.forEach((d, i) => { doc.text(d.slice(0, 3), startX + (i * colWidth), y); });
            doc.text('Toplam', totalHeaderX, y);
            y += 5; doc.line(10, y, 285, y); y += 3;
            doc.setFontSize(7);
            staff.forEach(s => {
                if (y > 170) {
                    doc.addPage(); y = 20;
                    doc.setFontSize(9); doc.setFont(undefined, 'bold');
                    doc.text('Personel', 10, y);
                    mobileDays.forEach((d, i) => { doc.text(d.slice(0, 3), startX + (i * colWidth), y); });
                    doc.text('Toplam', totalHeaderX, y);
                    y += 5; doc.line(10, y, 285, y); y += 5;
                    doc.setFontSize(7); doc.setFont(undefined, 'normal');
                }
                const startY = y;
                doc.setFont(undefined, 'bold');
                doc.text(s.name, 10, y + 3);
                doc.setFont(undefined, 'normal');
                let maxLines = 1;
                mobileDays.forEach((d, i) => {
                    const shList = shifts.filter(x => x.staffId === s.id && x.day === i);
                    const xPos = startX + (i * colWidth);
                    const centerPos = xPos + (colWidth / 2) - 2;
                    if (shList.length === 0) { doc.text('-', centerPos, y + 3, { align: 'center' }); }
                    else if (shList.some(x => x.tag === 'YILLIK')) { doc.setTextColor(220, 38, 38); doc.setFont(undefined, 'bold'); doc.text('IZIN', centerPos, y + 3, { align: 'center' }); doc.setFont(undefined, 'normal'); doc.setTextColor(0, 0, 0); }
                    else {
                        let lineY = y + 3;
                        shList.forEach((sh, idx) => {
                            const taskName = sh.task ? sh.task.replace('Antren\u00F6r\u00FC', 'ANT.').replace('&', '&') : 'G\u00F6revli';
                            doc.setFont(undefined, 'bold'); doc.setFontSize(6);
                            doc.text(taskName, xPos + 1, lineY);
                            doc.setFont(undefined, 'normal'); doc.setFontSize(7);
                            doc.text(`${sh.start}-${sh.end}`, xPos + 1, lineY + 2.5);
                            lineY += 5;
                            maxLines = Math.max(maxLines, shList.length);
                        });
                    }
                });
                const total = shifts.filter(x => x.staffId === s.id).reduce((a, b) => a + minDiff(b.start, b.end), 0);
                doc.setFont(undefined, 'bold'); doc.setFontSize(9);
                doc.text(`${(total / 60).toFixed(0)}`, totalHeaderX + 5, y + 3, { align: 'center' });
                doc.setFont(undefined, 'normal'); doc.setFontSize(7);
                const actualRowHeight = Math.max(rowHeight, maxLines * 5 + 6);
                y += actualRowHeight;
                doc.setDrawColor(220, 220, 220); doc.line(10, y, 285, y); doc.setDrawColor(0, 0, 0);
                y += 6;
            });
            const pdfBlob = doc.output('blob');
            const fileName = `${currentUnit.name}_Shift_${weekISO}.pdf`;
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                await navigator.share({ title: title, files: [file] });
            } else {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(pdfBlob);
                link.download = fileName;
                link.click();
                toast.show('PDF indirildi!');
            }
        } catch (err) { console.error('PDF error:', err); toast.show('PDF olu\u015Fturulamad\u0131', true); }
    };

    return {
        emailOpen, setEmailOpen,
        emailForm, setEmailForm,
        emailSending,
        sendEmail, downloadExcel, handleShare
    };
};
