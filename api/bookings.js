import { createClient } from "@supabase/supabase-js";

// Simple in-memory sliding-window rate limiter: 10 requests per minute per IP.
// Note: this is per serverless instance (best-effort), not a global guarantee
// across all Vercel regions/instances, but it's enough to blunt abusive bursts.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const requestLog = new Map(); // ip -> array of request timestamps (ms)

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (requestLog.get(ip) || []).filter((ts) => ts > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    requestLog.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return false;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const adminSecret = process.env.ADMIN_API_SECRET;
  const providedSecret = req.headers["x-admin-secret"];
  if (!adminSecret || providedSecret !== adminSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }


  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!bookingId || !name) {
    return res.status(400).json({ error: "bookingId and name are required" });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("bookings")
      .upsert({ booking_id: bookingId, name }, { onConflict: "booking_id" });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, bookingId, name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
