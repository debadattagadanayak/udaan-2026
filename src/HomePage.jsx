import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRateLimitRemainingMs, clearRateLimit } from "./rateLimit.js";
import goldLogo from "./assets/udaan-logo-gold.png";
import "./HomePage.css";

function formatCountdown(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function HomePage() {
  const [bookingId, setBookingId] = useState("");
  const [error, setError] = useState("");
  const [remainingMs, setRemainingMs] = useState(() => getRateLimitRemainingMs());
  const navigate = useNavigate();

  useEffect(() => {
    if (remainingMs <= 0) return;

    const interval = setInterval(() => {
      const remaining = getRateLimitRemainingMs();
      setRemainingMs(remaining);
      if (remaining <= 0) {
        clearRateLimit();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingMs > 0]);

  function handleSubmit(e) {
    e.preventDefault();
    if (remainingMs > 0) return;
    const trimmed = bookingId.trim();
    if (!trimmed) {
      setError("Please enter your booking ID.");
      return;
    }
    setError("");
    navigate(`/booking/${encodeURIComponent(trimmed)}`);
  }

  const isLocked = remainingMs > 0;

  return (
    <div className="home-page">
      <img src={goldLogo} className="home-logo" alt="UDAAN 2026" />
      <p className="home-subtitle">Enter your booking ID to fetch your ticket</p>
      <form className="home-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="home-input"
          placeholder="Booking ID"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          autoFocus
        />
        {error && <p className="home-error">{error}</p>}
        <button type="submit" className="home-fetch-btn" disabled={isLocked}>
          {isLocked ? `Try again in ${formatCountdown(remainingMs)}` : "Fetch Ticket"}
        </button>
      </form>
    </div>
  );
}

