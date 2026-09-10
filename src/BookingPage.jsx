import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EventTicket from "./EventTicket.jsx";
import { markRateLimited } from "./rateLimit.js";
import "./HomePage.css";

const QR_SIZE = 300;

function buildQrUrl(bookingId) {
  return (
    "https://quickchart.io/qr" +
    "?text=" +
    encodeURIComponent(bookingId) +
    "&size=" +
    QR_SIZE +
    "&margin=1"
  );
}

export default function BookingPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | found | not-found | rate-limited
  const [name, setName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBooking() {
      setStatus("loading");
      try {
        const res = await fetch(`/api/booking-lookup?bookingId=${encodeURIComponent(bookingId)}`);

        if (cancelled) return;

        if (res.status === 429) {
          markRateLimited();
          setStatus("rate-limited");
          return;
        }

        if (!res.ok) {
          setStatus("not-found");
          return;
        }

        const data = await res.json();
        setName(data.name);
        setStatus("found");
      } catch {
        if (!cancelled) setStatus("not-found");
      }
    }

    if (bookingId) {
      loadBooking();
    } else {
      setStatus("not-found");
    }

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (status === "loading") {
    return <p className="booking-status">Loading your ticket…</p>;
  }

  if (status === "rate-limited") {
    return (
      <div className="booking-status-wrapper">
        <p className="booking-status">Too many requests. Please wait a minute and try again.</p>
        <button type="button" className="home-fetch-btn" onClick={() => navigate("/")}>
          Back
        </button>
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="booking-status-wrapper">
        <p className="booking-status">Booking not found. Please check your link.</p>
        <button type="button" className="home-fetch-btn" onClick={() => navigate("/")}>
          Back
        </button>
      </div>
    );
  }

  return <EventTicket passengerName={name} qrImageUrl={buildQrUrl(bookingId)} />;
}
