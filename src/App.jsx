import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage.jsx";
import EventTicket from "./EventTicket.jsx";
import BookingPage from "./BookingPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sample" element={<EventTicket />} />
        <Route path="/booking/:bookingId" element={<BookingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
