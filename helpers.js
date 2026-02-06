// lib/helpers.js — Genel yardımcı fonksiyonlar (hash, id üretimi)
import crypto from "crypto";

const sha256 = s => crypto.createHash("sha256").update(String(s)).digest("hex");
const createSid = () => crypto.randomBytes(18).toString("hex");
const createId = () => crypto.randomUUID();

export { sha256, createSid, createId };
