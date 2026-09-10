// One-off/admin script to insert or update a booking record directly in Supabase.
// Uses the SERVICE ROLE key (bypasses Row Level Security) - this must only ever
// be run locally/server-side, never shipped to the browser.
//
// Setup: add to .env.local (NOT prefixed with VITE_, so Vite never bundles it):
//   SUPABASE_URL=https://uhrtmmuzrxzsduiqahdw.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=<service_role key from Supabase Project Settings > API>
//
// Usage:
//   npm run add-booking -- <booking_id> "<full name>"

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const [, , bookingId, ...nameParts] = process.argv;
const name = nameParts.join(" ");

if (!bookingId || !name) {
  console.error('Usage: npm run add-booking -- <booking_id> "<full name>"');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env.local. See comment at top of this file."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const { error } = await supabase
  .from("bookings")
  .upsert({ booking_id: bookingId, name }, { onConflict: "booking_id" });

if (error) {
  console.error("Insert failed:", error.message);
  process.exit(1);
}

console.log(`Saved booking "${bookingId}" -> "${name}"`);
