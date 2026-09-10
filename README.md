# UDAAN 2026 - Digital Event Ticket

A boarding-pass-style digital ticket for "UDAAN 2026", built with React + Vite and backed by Supabase. Guests enter their booking ID on the homepage to fetch their personalized ticket (with QR code), and can download it as a PNG or PDF.

## Features

- **Homepage** (`/`) — enter a booking ID and click **Fetch Ticket** to look it up.
- **Booking ticket** (`/booking/:bookingId`) — fetches the guest's name from Supabase and renders their personalized boarding-pass ticket with a QR code encoding the booking ID.
- **Sample ticket** (`/sample`) — a static, unpersonalized preview of the ticket design.
- **Download** the rendered ticket as a PNG image or PDF.
- **Rate limiting** — booking lookups are capped at 10 requests/minute per IP (server-side). After a `429`, the Fetch Ticket button on the homepage is disabled for 2 minutes with a live countdown.
- **Admin API** (`api/bookings.js`) — secret-protected endpoint to create/update bookings (used by the `add-booking` script).

## Project Structure

- `src/HomePage.jsx` — booking ID input + Fetch Ticket button, rate-limit countdown UI.
- `src/BookingPage.jsx` — fetches booking data via `/api/booking-lookup` and renders the ticket, or a not-found/rate-limited state.
- `src/EventTicket.jsx` — the ticket UI itself, plus PNG/PDF download logic.
- `api/booking-lookup.js` — public, rate-limited `GET` endpoint that looks up a booking by ID.
- `api/bookings.js` — admin-only, rate-limited `POST` endpoint (requires `x-admin-secret` header) to upsert a booking.
- `scripts/add-booking.mjs` — CLI script to add/update a booking directly via the Supabase service role key.
- `supabase/schema.sql` — table schema and Row Level Security policy for the `bookings` table.
- `vite.config.js` — includes a dev-only middleware plugin so `npm run dev` can run the `api/*.js` serverless functions locally (Vite alone doesn't serve them).

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env.local` file (see `.env.example`) with:

```
VITE_SUPABASE_URL=<your Supabase project URL>
VITE_SUPABASE_ANON_KEY=<your Supabase anon/public key>
SUPABASE_SERVICE_ROLE_KEY=<your Supabase service role key>   # server-side only, admin script + admin API
ADMIN_API_SECRET=<a secret string you choose>                # required by api/bookings.js
```

Run the dev server (also serves `/api/*` locally via a Vite middleware shim):

```bash
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`) in your browser.

## Build

```bash
npm run build
```

The production build is output to the `dist/` folder. Preview it with:

```bash
npm run preview
```

## Adding a Booking

Add or update a booking record directly in Supabase (bypasses the API, uses the service role key):

```bash
npm run add-booking -- <booking_id> "<full name>"
```

Alternatively, `POST` to `/api/bookings` with an `x-admin-secret` header matching `ADMIN_API_SECRET`, and a JSON body of `{ "bookingId": "...", "name": "..." }`.

## Usage

1. Guest opens the homepage and enters their booking ID.
2. Clicking **Fetch Ticket** navigates to `/booking/:bookingId`, which looks up the name via `/api/booking-lookup` and renders the personalized ticket with QR code.
3. Guest clicks **Download Ticket** to save it as a PNG image or PDF.

## Deployment

The project is deployed on Vercel (`vercel.json` rewrites all routes to `index.html` for client-side routing; `api/*.js` files are deployed as serverless functions automatically). Deploy with:

```bash
npx vercel --prod
```
