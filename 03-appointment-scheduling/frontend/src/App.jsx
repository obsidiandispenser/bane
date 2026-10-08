import React, { useEffect, useState } from "react";
import "./App.css";
// CHANGE 6: API URL
const API = "http://localhost:3000/api/appointments";
export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  // CHANGE 2: Form state
  const [patient, setPatient] = useState("");
  const [slotId, setSlotId] = useState("");
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [view, setView] = useState("patient");
  const [scheduleDoctor, setScheduleDoctor] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { fetchAppointments(); }, []);
  async function fetchAppointments() {
    setLoading(true); setError("");
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Could not load appointments");
      const data = await response.json();
      const availability = await fetch(`${API}/availability`);
      if (!availability.ok) throw new Error("Could not load availability");
      setAppointments(data); setSlots(await availability.json());
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  function resetForm() { setPatient(""); setSlotId(""); setEditingId(null); }
  async function handleSubmit(event) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      // CHANGE 4: Request body
      const body = { patient, slotId };
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Booking failed"); }
      resetForm(); await fetchAppointments();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  function handleEdit(appointment) {
    setPatient(appointment.patient); setSlotId(appointment.slotId); setEditingId(appointment._id); setError("");
  }
  async function handleDelete(id) {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Cancellation failed"); }
      if (editingId === id) resetForm();
      await fetchAppointments();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  async function addAvailability(event) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/availability`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctor, date, time }),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Could not add slot"); }
      setDate(""); setTime(""); await fetchAppointments();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  const availableSlots = slots.filter(slot => !appointments.some(appointment => appointment.slotId === slot._id && appointment._id !== editingId));
  const dailySchedule = appointments.filter(appointment => appointment.doctor === scheduleDoctor.trim() && appointment.date === scheduleDate);
  const visibleAppointments = view === "doctor" ? dailySchedule : appointments;
  return <main>
    {/* CHANGE 1: Application title */}
    <header><h1>Appointment Scheduling</h1><p>Book and manage fixed 30-minute appointments.</p></header>
    <section><label htmlFor="view">View</label><select id="view" value={view} onChange={event => { setView(event.target.value); resetForm(); }}><option value="patient">Patient</option><option value="doctor">Doctor</option></select><p className="muted">Views are for a practical demonstration, without authentication.</p></section>
    {error && <p className="error" role="alert">{error}</p>}
    {loading && <p role="status">Loading…</p>}
    <div className="layout">
      <section>
        {view === "patient" ? <><h2>{editingId ? "Reschedule appointment" : "Book appointment"}</h2>
          <form onSubmit={handleSubmit}><fieldset disabled={loading}>
            {/* CHANGE 3: Form inputs */}
            <label htmlFor="patient">Patient name</label><input id="patient" value={patient} onChange={event => setPatient(event.target.value)} required />
            <label htmlFor="slot">Available slot</label><select id="slot" value={slotId} onChange={event => setSlotId(event.target.value)} required><option value="">Choose a slot</option>{availableSlots.map(slot => <option key={slot._id} value={slot._id}>{slot.doctor} — {slot.date} at {slot.time}</option>)}</select>
            {!loading && availableSlots.length === 0 && <p>No free slots. A doctor must add availability first.</p>}
            <button>{editingId ? "Save changes" : "Book"}</button>{editingId && <button className="secondary" type="button" onClick={resetForm}>Cancel Edit</button>}
          </fieldset></form></> : <><h2>Add availability</h2><form onSubmit={addAvailability}><fieldset disabled={loading}>
            <label htmlFor="doctor">Doctor name</label><input id="doctor" value={doctor} onChange={event => setDoctor(event.target.value)} required />
            <label htmlFor="date">Date</label><input id="date" type="date" value={date} onChange={event => setDate(event.target.value)} required />
            <label htmlFor="time">Start time</label><input id="time" type="time" step="1800" value={time} onChange={event => setTime(event.target.value)} required />
            <button>Add 30-minute slot</button>
          </fieldset></form><p className="muted">Publish each time you can see a patient. Published slots remain available after cancellation.</p>
          <h2>Published availability</h2>{!loading && slots.length === 0 && <p>No slots published.</p>}
          {slots.map(slot => <p key={slot._id}>{slot.doctor}: {slot.date} {slot.time} — {appointments.some(a => a.slotId === slot._id) ? "Booked" : "Available"}</p>)}</>}
      </section>
      <section><h2>{view === "doctor" ? "Daily schedule" : "Appointments"}</h2>
        {view === "doctor" && <><label htmlFor="schedule-doctor">Doctor name</label><input id="schedule-doctor" value={scheduleDoctor} onChange={event => setScheduleDoctor(event.target.value)} /><label htmlFor="schedule-date">Schedule date</label><input id="schedule-date" type="date" value={scheduleDate} onChange={event => setScheduleDate(event.target.value)} /></>}
        <button className="secondary" disabled={loading} onClick={fetchAppointments}>Refresh</button>
        {!loading && !error && visibleAppointments.length === 0 && <p>{view === "doctor" ? "Select a doctor and date. No appointments to display." : "No appointments yet."}</p>}
        {visibleAppointments.map(appointment => <article key={appointment._id}>
          {/* CHANGE 5: Display fields */}
          <h3>{appointment.patient}</h3><p>Doctor: {appointment.doctor}</p><p>{appointment.date} at {appointment.time} (30 minutes)</p>
          {view === "patient" && <><button disabled={loading} onClick={() => handleEdit(appointment)}>Reschedule</button><button className="delete" disabled={loading} onClick={() => handleDelete(appointment._id)}>Cancel appointment</button></>}
        </article>)}
      </section>
    </div>
  </main>;
}
