import React, { useEffect, useState } from "react";
import "./App.css";
// CHANGE 6: API URL
const API = "http://localhost:3000/api/products";
export default function App() {
  const [records, setRecords] = useState([]);
  // CHANGE 2: Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
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
    setName("");
    setPrice("");
    setQuantity("");
    setCategory("");
    setEditingId(null);
  }
  async function handleSubmit(event) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      // CHANGE 4: Request body
      const body = { name, price: Number(price), quantity: Number(quantity), category };
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Could not save record"); }
      resetForm(); await fetchRecords();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  function handleEdit(record) {
    setName(record.name);
    setPrice(record.price);
    setQuantity(record.quantity);
    setCategory(record.category);
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
    <header><h1>Product Inventory</h1><p>Simple records, easy to manage.</p></header>
    
    {error && <p className="error" role="alert">{error}</p>}
    {loading && <p role="status">Loading…</p>}
    <div className="layout">
      <section><h2>{editingId ? "Edit record" : "Add record"}</h2>
        <form onSubmit={handleSubmit}><fieldset disabled={loading}>
          {/* CHANGE 3: Form inputs */}
          <label htmlFor="name">Name</label>
              <input id="name" type="text" value={name} onChange={event => setName(event.target.value)} required />
<label htmlFor="price">Price</label>
              <input id="price" type="number" min="0" step="any" value={price} onChange={event => setPrice(event.target.value)} required />
<label htmlFor="quantity">Quantity</label>
              <input id="quantity" type="number" min="0" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} required />
<label htmlFor="category">Category</label>
              <input id="category" type="text" value={category} onChange={event => setCategory(event.target.value)} required />
          <button type="submit">{editingId ? "Save changes" : "Add"}</button>
          {editingId && <button className="secondary" type="button" onClick={resetForm}>Cancel Edit</button>}
        </fieldset></form>
      </section>
      <section><h2>Records</h2><button className="secondary" onClick={fetchRecords} disabled={loading}>Refresh</button>
        {!loading && !error && visibleRecords.length === 0 && <p>No records yet. Add your first record.</p>}
        {visibleRecords.map(record => <article key={record._id}>
          {/* CHANGE 5: Display fields */}
          <p>Name: {record.name}</p>
<p>Price: {record.price}</p>
<p>Quantity: {record.quantity}</p>
<p>Category: {record.category}</p>
          <div><button onClick={() => handleEdit(record)} disabled={loading}>Edit</button>
          <button className="delete" onClick={() => handleDelete(record._id)} disabled={loading}>Delete</button></div>
        </article>)}
      </section>
    </div>
  </main>;
}
