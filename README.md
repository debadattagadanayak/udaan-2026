# UDAAN 2026 - Editable Event Ticket

A boarding-pass-style event ticket for "UDAAN 2026", built with React + Vite. Every piece of text on the ticket is directly editable in the browser, and the finished ticket can be downloaded as a PNG image.

## Features

- Click any text on the ticket to edit it in place.
- Boarding-pass layout with a main panel and a tearable stub panel.
- "Download Ticket" button to export the ticket as a PNG image.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the dev server:

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

## Usage

1. Click on any field (passenger name, date, venue, etc.) and type to edit.
2. Once you're happy with the ticket, click **Download Ticket** to save it as a PNG image.
