import { useCallback, useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./EventTicket.css";
import goldLogo from "./assets/udaan-logo-gold.png";
import blackLogo from "./assets/udaan-logo-black.png";

const TICKET_NATURAL_WIDTH = 1100;
const TICKET_ASPECT_RATIO = 2.35;

export default function EventTicket({ passengerName = "", qrImageUrl = "" }) {
  const ticketRef = useRef(null);
  const scaleOuterRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloading, setDownloading] = useState(null); // null | "image" | "pdf"

  useEffect(() => {
    const outerEl = scaleOuterRef.current;
    if (!outerEl) return;
    const updateScale = () => {
      const availableWidth = outerEl.clientWidth;
      setScale(Math.min(1, availableWidth / TICKET_NATURAL_WIDTH));
    };
    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(outerEl);
    window.addEventListener("resize", updateScale);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  const captureTicket = useCallback(async () => {
    const el = ticketRef.current;
    if (!el) return null;
    // box-shadow renders as an opaque black smear in html2canvas, so hide it during capture.
    const prevBoxShadow = el.style.boxShadow;
    el.style.boxShadow = "none";
    try {
      return await html2canvas(el, {
        backgroundColor: "#050607",
        scale: 2,
        useCORS: true,
      });
    } finally {
      el.style.boxShadow = prevBoxShadow;
    }
  }, []);

  const handleDownloadImage = useCallback(async () => {
    setShowDownloadMenu(false);
    setDownloading("image");
    try {
      const canvas = await captureTicket();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = "udaan-2026-ticket.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(null);
    }
  }, [captureTicket]);

  const handleDownloadPdf = useCallback(async () => {
    setShowDownloadMenu(false);
    setDownloading("pdf");
    try {
      const canvas = await captureTicket();
      if (!canvas) return;
      const pdf = new jsPDF({
        orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("udaan-2026-ticket.pdf");
    } finally {
      setDownloading(null);
    }
  }, [captureTicket]);

  return (
    <div className="ticket-wrapper">
      <div
        className="ticket-scale-outer"
        ref={scaleOuterRef}
        style={{ height: (TICKET_NATURAL_WIDTH / TICKET_ASPECT_RATIO) * scale }}
      >
        <div
          className="ticket-scale-inner"
          style={{ width: TICKET_NATURAL_WIDTH, transform: `scale(${scale})` }}
        >
          <div className="ticket" ref={ticketRef}>
            {/* ================= MAIN PANEL ================= */}
            <div className="panel main-panel">
              <div className="tags" style={{ whiteSpace: "pre-line" }}>
            {"DANCE\nMUSIC\nFOOD\nAWARDS"}
            <div className="tags-hashtag">#UDAAN2026</div>
          </div>

          <div className="title-block">
            <img src={goldLogo} className="main-logo" alt="UDAAN 2026" />
            <div className="divider" />
            <div className="tagline">ANNUAL EVENT</div>
          </div>

          <div className="flight-route">
            <div className="route-point">
              <div className="route-label">ORIGIN</div>
              <div className="route-code">EVERYDAY</div>
            </div>
            <div className="route-line">
              <span className="route-plane">&#9992;</span>
            </div>
            <div className="route-point route-point-end">
              <div className="route-label">DESTINATION</div>
              <div className="route-code">EXTRAORDINARY</div>
            </div>
          </div>

          <div className="script-text">
            {"Organized by Frolics Team"}
          </div>

          <div className="info-card">
            <div className="info-item">
              <span className="info-icon">&#128100;</span>
              <div>
                <div className="info-label">PASSENGER NAME</div>
                <div className={`info-value${passengerName ? "" : " placeholder"}`}>
                  {passengerName}
                </div>
              </div>
            </div>

            <div className="info-divider" />
            <span className="plane-mini">&#9992;</span>
            <div className="info-divider" />

            <div className="info-item">
              <span className="info-icon">&#128197;</span>
              <div>
                <div className="info-label">EVENT DATE &amp; TIME</div>
                <div className="info-value" style={{ whiteSpace: "pre-line" }}>
                  {"27 NOV 2026\n5:00 PM Onwards"}
                </div>
              </div>
            </div>

            <div className="info-divider" />

            <div className="info-item">
              <span className="info-icon">&#128205;</span>
              <div>
                <div className="info-label">VENUE</div>
                <div className="info-value" style={{ whiteSpace: "pre-line" }}>
                  {"45 iCON\nBaner, Pune"}
                </div>
              </div>
            </div>
          </div>

          <div className="footer-row">
            <div className="footer-item">
              <span className="footer-icon">&#128188;</span>
              <span style={{ whiteSpace: "pre-line" }}>{"GOOD VIBES\nALLOWED"}</span>
            </div>
            <span className="footer-sep">|</span>
            <div className="footer-item">
              <span className="footer-icon">&#128101;</span>
              <span style={{ whiteSpace: "pre-line" }}>{"GREAT PEOPLE\nON BOARD"}</span>
            </div>
            <span className="footer-sep">|</span>
            <div className="footer-item">
              <span className="footer-icon">&#11088;</span>
              <span style={{ whiteSpace: "pre-line" }}>{"MEMORABLE\nJOURNEY AHEAD"}</span>
            </div>
          </div>
        </div>

        {/* ================= PERFORATION ================= */}
        <div className="perforation">
          <span className="notch notch-top" />
          <span className="notch notch-mid" />
          <span className="notch notch-bottom" />
        </div>

        {/* ================= STUB PANEL ================= */}
        <div className="panel stub-panel">
          <div className="stub-title-group">
            <img src={blackLogo} className="stub-logo-img" alt="UDAAN 2026" />
            <div className="divider dark" />
          </div>
          <div className="annual-event">ANNUAL EVENT</div>

          <div className="boarding-pass">BOARDING PASS</div>
          <div className="admit-one">ADMIT ONE</div>

          <div className="qr-box">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            {qrImageUrl ? (
              <img className="qr-image" src={qrImageUrl} alt="Booking QR code" />
            ) : (
              <>
                <div className="qr-pattern" />
                <div className="qr-text" style={{ whiteSpace: "pre-line" }}>
                  {"YOUR\nQR CODE\nHERE"}
                </div>
              </>
            )}
          </div>

          <div className="stub-footer">
            <span>SCAN</span>
            <span>|</span>
            <span>CHECK-IN</span>
            <span>|</span>
            <span>TAKE OFF</span>
          </div>
        </div>
          </div>
        </div>
      </div>

      <div className="download-section">
        <button
          type="button"
          className="download-ticket-btn"
          onClick={() => setShowDownloadMenu((v) => !v)}
          disabled={downloading !== null}
        >
          {downloading === "image"
            ? "Preparing image..."
            : downloading === "pdf"
            ? "Preparing PDF..."
            : "Download Ticket"}
        </button>
        {showDownloadMenu && (
          <div className="download-menu">
            <button type="button" onClick={handleDownloadImage}>
              Download as Image (PNG)
            </button>
            <button type="button" onClick={handleDownloadPdf}>
              Download as PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
