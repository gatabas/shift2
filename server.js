import "dotenv/config";
import compression from 'compression';
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB bağlantısı
import { connectDB } from "./lib/db.js";

// Route'lar
import authRoutes from "./routes/auth.js";
import staffRoutes from "./routes/staff.js";
import tasksRoutes from "./routes/tasks.js";
import adminRoutes from "./routes/admin.js";
import archiveRoutes from "./routes/archive.js";
import mailRoutes from "./routes/mail.js";
import pdksRoutes from "./routes/pdks.js";
import tvRoutes from "./routes/tv.js";

// Cron
import { startCronJobs } from "./jobs/cron.js";

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(compression());
app.use(cookieParser());
app.use(cors({ origin: ["http://localhost:3000", "https://spodeme.pau.edu.tr"], credentials: true }));
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// DB
await connectDB();

// Routes mount (prefix yok, path'ler route dosyalarında tam)
app.use(authRoutes);
app.use(staffRoutes);
app.use(tasksRoutes);
app.use(adminRoutes);
app.use(archiveRoutes);
app.use(mailRoutes);
app.use(pdksRoutes);
app.use(tvRoutes);

// Cron başlat
startCronJobs();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Sunucu Hazır: http://localhost:${PORT}`));
