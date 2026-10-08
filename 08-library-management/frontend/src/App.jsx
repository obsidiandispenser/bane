import React, { useEffect, useState } from "react";
import "./App.css";
// CHANGE 6: API URL
const API = "http://localhost:3000/api/books";
export default function App() {
  const [records, setRecords] = useState([]);
  // CHANGE 2: Form state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [available, setAvailable] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    setTitle("");
    setAuthor("");
    setIsbn("");
    setAvailable(true);
    setEditingId(null);
  }
  async function handleSubmit(event) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      // CHANGE 4: Request body
      const body = { title, author, isbn, available };
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Could not save record"); }
      resetForm(); await fetchRecords();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  function handleEdit(record) {
    setTitle(record.title);
    setAuthor(record.author);
    setIsbn(record.isbn);
    setAvailable(record.available);
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
  const visibleRecords = records;
  return <main>
    {/* CHANGE 1: Application title */}
    <header><h1>Library Management</h1><p>Simple records, easy to manage.</p></header>
    
    {error && <p className="error" role="alert">{error}</p>}
    {loading && <p role="status">Loading…</p>}
    <div className="layout">
      <section><h2>{editingId ? "Edit record" : "Add record"}</h2>
        <form onSubmit={handleSubmit}><fieldset disabled={loading}>
          {/* CHANGE 3: Form inputs */}
          <label htmlFor="title">Title</label>
              <input id="title" type="text" value={title} onChange={event => setTitle(event.target.value)} required />
<label htmlFor="author">Author</label>
              <input id="author" type="text" value={author} onChange={event => setAuthor(event.target.value)} required />
<label htmlFor="isbn">ISBN</label>
              <input id="isbn" type="text" value={isbn} onChange={event => setIsbn(event.target.value)} required />
<label><input type="checkbox" checked={available} onChange={event => setAvailable(event.target.checked)} /> Available</label>
          <button type="submit">{editingId ? "Save changes" : "Add"}</button>
          {editingId && <button className="secondary" type="button" onClick={resetForm}>Cancel Edit</button>}
        </fieldset></form>
      </section>
      <section><h2>Records</h2><button className="secondary" onClick={fetchRecords} disabled={loading}>Refresh</button>
        {!loading && !error && visibleRecords.length === 0 && <p>No records yet. Add your first record.</p>}
        {visibleRecords.map(record => <article key={record._id}>
          {/* CHANGE 5: Display fields */}
          <p>Title: {record.title}</p>
<p>Author: {record.author}</p>
<p>ISBN: {record.isbn}</p>
<p>Available: {record.available ? "Yes" : "No"}</p>
          <div><button onClick={() => handleEdit(record)} disabled={loading}>Edit</button>
          <button className="delete" onClick={() => handleDelete(record._id)} disabled={loading}>Delete</button></div>
        </article>)}
      </section>
    </div>
  </main>;
}
