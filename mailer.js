// lib/mailer.js — Nodemailer SMTP transporter yapılandırması
import nodemailer from "nodemailer";

let transporter;
try {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "eposta.pau.edu.tr",
        port: 587, secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        tls: { ciphers: "DEFAULT@SECLEVEL=0", rejectUnauthorized: false }
    });
} catch (err) { console.error("Mail hatası:", err.message); }

export { transporter };
