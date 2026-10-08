import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3000/api/appointments";

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [patient, setPatient] = useState("");
  const [slotId, setSlotId] = useState("");
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [role, setRole] = useState("patient");
  const [scheduleDoctor, setScheduleDoctor] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    setError("");
    try {
      const res = await fetch(API);
      const availability = await fetch(`${API}/availability`);
      if (!res.ok || !availability.ok) {
        throw new Error("Could not load appointments");
      }
      setAppointments(await res.json());
      setSlots(await availability.json());
    } catch (err) {
      setError(err.message);
    }
  }

  function resetForm() {
    setPatient("");
    setSlotId("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const appointment = { patient, slotId };
      const res = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not book appointment");
      }
      resetForm();
      await fetchAppointments();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(appointment) {
    setPatient(appointment.patient);
    setSlotId(appointment.slotId);
    setEditingId(appointment._id);
  }

  async function handleDelete(id) {
    setError("");
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Could not cancel appointment");
      }
      if (editingId === id) {
        resetForm();
      }
      await fetchAppointments();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addAvailability(e) {
    e.preventDefault();
    setError("");
    try {
      const slot = { doctor, date, time };
      const res = await fetch(`${API}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slot),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not add availability");
      }
      setDate("");
      setTime("");
      await fetchAppointments();
    } catch (err) {
      setError(err.message);
    }
  }

  const availableSlots = slots.filter(slot =>
    !appointments.some(appointment => appointment.slotId === slot._id && appointment._id !== editingId)
  );
  const visibleAppointments = role === "patient"
    ? appointments
    : appointments.filter(appointment =>
        appointment.doctor === scheduleDoctor.trim() && appointment.date === scheduleDate
      );

  return (
    <main>
      <h1>Appointment Scheduling</h1>
      {error && <p className="error" role="alert">{error}</p>}
      <select value={role} onChange={e => {
        setRole(e.target.value);
        resetForm();
      }} aria-label="View">
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
      </select>

      {role === "patient" ? (
        <form onSubmit={handleSubmit}>
          <h2>{editingId ? "Reschedule Appointment" : "Book Appointment"}</h2>
          <input
            placeholder="Patient name"
            aria-label="Patient name"
            value={patient}
            onChange={e => setPatient(e.target.value)}
            required
          />
          <select value={slotId} onChange={e => setSlotId(e.target.value)} aria-label="Available slot" required>
            <option value="">Choose a slot</option>
            {availableSlots.map(slot => (
              <option key={slot._id} value={slot._id}>
                {slot.doctor} — {slot.date} at {slot.time}
              </option>
            ))}
          </select>
          {availableSlots.length === 0 && <p>No free slots. Add availability in Doctor view.</p>}
          <button type="submit">{editingId ? "Update" : "Book"}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancel Edit</button>}
        </form>
      ) : (
        <>
          <form onSubmit={addAvailability}>
            <h2>Add Availability (30 minutes)</h2>
            <input
              placeholder="Doctor name"
              aria-label="Doctor name"
              value={doctor}
              onChange={e => setDoctor(e.target.value)}
              required
            />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Date" required />
            <input type="time" step="1800" value={time} onChange={e => setTime(e.target.value)} aria-label="Time" required />
            <button type="submit">Add Slot</button>
          </form>
          <h2>Published Slots</h2>
          {slots.map(slot => (
            <p key={slot._id}>
              {slot.doctor}: {slot.date} at {slot.time} — {appointments.some(a => a.slotId === slot._id) ? "Booked" : "Available"}
            </p>
          ))}
          <h2>Daily Schedule</h2>
          <input
            placeholder="Doctor name"
            aria-label="Schedule doctor"
            value={scheduleDoctor}
            onChange={e => setScheduleDoctor(e.target.value)}
          />
          <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} aria-label="Schedule date" />
        </>
      )}

      <h2>Appointments</h2>
      {!error && visibleAppointments.length === 0 && <p>No appointments to display.</p>}
      {visibleAppointments.map(appointment => (
        <article key={appointment._id}>
          <h3>{appointment.patient}</h3>
          <p>Doctor: {appointment.doctor}</p>
          <p>{appointment.date} at {appointment.time}</p>
          {role === "patient" && (
            <>
              <button onClick={() => handleEdit(appointment)}>Reschedule</button>
              <button className="delete" onClick={() => handleDelete(appointment._id)}>Cancel Appointment</button>
            </>
          )}
        </article>
      ))}
    </main>
  );
}
