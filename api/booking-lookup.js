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

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars");
  }

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const bookingId = typeof req.query.bookingId === "string" ? req.query.bookingId.trim() : "";
  if (!bookingId) {
    return res.status(400).json({ error: "bookingId is required" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select("name")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.status(200).json({ bookingId, name: data.name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
