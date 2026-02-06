import { Router } from "express";
import { requireAuth } from "../lib/auth.js";
import { transporter } from "../lib/mailer.js";

const router = Router();

/* ------- MAİL GÖNDERİM ------- */
router.post("/api/mail/sendShift", requireAuth, async (req, res) => {
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) return res.status(400).json({ message: "Eksik veri" });
    try {
        let recipientList = Array.isArray(to) ? to.join(", ") : to;
        await transporter.sendMail({ from: process.env.SMTP_USER, to: recipientList, subject: subject, html: html });
        res.json({ ok: true });
    } catch (e) { console.error("Mail Error:", e); res.status(500).json({ message: "Mail gönderilemedi" }); }
});

export default router;
