import React, { useEffect, useState } from "react";
import "./App.css";
// CHANGE 6: API URL
const API = "http://localhost:3000/api/students";
export default function App() {
  const [records, setRecords] = useState([]);
  // CHANGE 2: Form state
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [score, setScore] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("teacher");
  const [reportRoll, setReportRoll] = useState("");
  useEffect(() => { fetchRecords(); }, []);
  async function fetchRecords() {
    setLoading(true); setError("");
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Could not load records");
      setRecords(await response.json());
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  function resetForm() {
    setName("");
    setRollNumber("");
    setSubject("");
    setScore("");
    setEditingId(null);
  }
  async function handleSubmit(event) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      // CHANGE 4: Request body
      const body = { name, rollNumber, subject, score: Number(score) };
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Could not save record"); }
      resetForm(); await fetchRecords();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  function handleEdit(record) {
    setName(record.name);
    setRollNumber(record.rollNumber);
    setSubject(record.subject);
    setScore(record.score);
    setEditingId(record._id); setError("");
  }
  async function handleDelete(id) {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Could not delete record"); }
      if (editingId === id) resetForm();
      await fetchRecords();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  const visibleRecords = records.filter(record => view === "teacher" || (reportRoll.trim() && record.rollNumber === reportRoll.trim()));
  return <main>
    {/* CHANGE 1: Application title */}
    <header><h1>Student Performance Dashboard</h1><p>Simple records, easy to manage.</p></header>
    <section><label htmlFor="view">View</label><select id="view" value={view} onChange={event => { setView(event.target.value); resetForm(); }}><option value="teacher">Teacher</option><option value="student">Student</option></select>
        {view === "student" && <><label htmlFor="report-roll">Your roll number</label><input id="report-roll" value={reportRoll} onChange={event => setReportRoll(event.target.value)} placeholder="Enter your roll number to see reports" /></>}
        <p className="muted">View selection is for this practical demonstration; it is not authentication.</p></section>
    {error && <p className="error" role="alert">{error}</p>}
    {loading && <p role="status">Loading…</p>}
    <div className="layout">
      {view === "teacher" && (<section><h2>{editingId ? "Edit record" : "Add record"}</h2>
        <form onSubmit={handleSubmit}><fieldset disabled={loading}>
          {/* CHANGE 3: Form inputs */}
          <label htmlFor="name">Name</label>
              <input id="name" type="text" value={name} onChange={event => setName(event.target.value)} required />
<label htmlFor="rollNumber">Roll number</label>
              <input id="rollNumber" type="text" value={rollNumber} onChange={event => setRollNumber(event.target.value)} required />
<label htmlFor="subject">Subject</label>
              <input id="subject" type="text" value={subject} onChange={event => setSubject(event.target.value)} required />
<label htmlFor="score">Score (0–100)</label>
              <input id="score" type="number" min="0" step="1" max="100" value={score} onChange={event => setScore(event.target.value)} required />
          <button type="submit">{editingId ? "Save changes" : "Add"}</button>
          {editingId && <button className="secondary" type="button" onClick={resetForm}>Cancel Edit</button>}
        </fieldset></form>
      </section>)}
      <section><h2>Performance reports</h2><button className="secondary" onClick={fetchRecords} disabled={loading}>Refresh</button>
        {!loading && !error && visibleRecords.length === 0 && <p>Enter a roll number to view reports, or add a student record in teacher view.</p>}
        {visibleRecords.map(record => <article key={record._id}>
          {/* CHANGE 5: Display fields */}
          <p>Name: {record.name}</p>
<p>Roll number: {record.rollNumber}</p>
<p>Subject: {record.subject}</p>
<p>Score (0–100): {record.score}</p>
          {view === "teacher" && <div><button onClick={() => handleEdit(record)} disabled={loading}>Edit</button>
          <button className="delete" onClick={() => handleDelete(record._id)} disabled={loading}>Delete</button></div>}
        </article>)}
      </section>
    </div>
  </main>;
}
