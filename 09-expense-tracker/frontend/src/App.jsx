import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3000/api/expenses";

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    setError("");
    try {
      const res = await fetch(API);
      if (!res.ok) {
        throw new Error("Could not load expenses");
      }
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function resetForm() {
    setAmount("");
    setCategory("");
    setDate("");
    setDescription("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const expense = {
        amount: Number(amount),
        category,
        date,
        description,
      };
      const res = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      if (!res.ok) {
        throw new Error("Could not save expense");
      }
      resetForm();
      await fetchExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(expense) {
    setAmount(expense.amount);
    setCategory(expense.category);
    setDate(expense.date);
    setDescription(expense.description);
    setEditingId(expense._id);
  }

  async function handleDelete(id) {
    setError("");
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Could not delete expense");
      }
      if (editingId === id) {
        resetForm();
      }
      await fetchExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>Expense Tracker</h1>
      {error && <p className="error" role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit Expense" : "Add Expense"}</h2>
        <fieldset>
          <input
            type="number"
            min="0.01"
            step="any"
            placeholder="Amount"
            aria-label="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Category"
            aria-label="Category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
          />
          <input
            type="date"
            placeholder="Date"
            aria-label="Date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Description"
            aria-label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
          <button type="submit">{editingId ? "Update" : "Add"}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>Cancel Edit</button>
          )}
        </fieldset>
      </form>

      <h2>Expenses</h2>
      {!error && expenses.length === 0 && <p>No expenses yet.</p>}
      {expenses.map(expense => (
        <article key={expense._id}>
          <p>Amount: {expense.amount}</p>
          <p>Category: {expense.category}</p>
          <p>Date: {expense.date}</p>
          <p>Description: {expense.description}</p>
          <button onClick={() => handleEdit(expense)}>Edit</button>
          <button className="delete" onClick={() => handleDelete(expense._id)}>Delete</button>
        </article>
      ))}
    </main>
  );
}
