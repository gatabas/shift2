// lib/rateLimiter.js — TV modu için IP bazlı rate limiting middleware
const tvRateLimit = new Map(); // IP -> { count, resetTime }
const TV_RATE_LIMIT = 60; // Dakikada max istek
const TV_RATE_WINDOW = 60 * 1000; // 1 dakika

function tvRateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const entry = tvRateLimit.get(ip);

    if (!entry || now > entry.resetTime) {
        tvRateLimit.set(ip, { count: 1, resetTime: now + TV_RATE_WINDOW });
        return next();
    }

    if (entry.count >= TV_RATE_LIMIT) {
        return res.status(429).json({ message: "Çok fazla istek. Lütfen bekleyin." });
    }

    entry.count++;
    next();
}

// Eski rate limit kayıtlarını her 5 dakikada temizle
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of tvRateLimit) {
        if (now > entry.resetTime) tvRateLimit.delete(ip);
    }
}, 5 * 60 * 1000);

export { tvRateLimiter };
