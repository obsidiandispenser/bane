import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3000/api/tasks";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [completed, setCompleted] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API);
      if (!res.ok) {
        throw new Error("Could not load tasks");
      }
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCompleted(false);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const task = {
        title,
        description,
        completed,
      };
      const res = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!res.ok) {
        throw new Error("Could not save task");
      }
      resetForm();
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(task) {
    setTitle(task.title);
    setDescription(task.description);
    setCompleted(task.completed);
    setEditingId(task._id);
  }

  async function handleDelete(id) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Could not delete task");
      }
      if (editingId === id) {
        resetForm();
      }
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Task Manager</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {loading && <p role="status">Loading…</p>}
      <form onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit Task" : "Add Task"}</h2>
        <fieldset disabled={loading}>
          <input
            type="text"
            placeholder="Title"
            aria-label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            aria-label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <label>
            <input
              type="checkbox"
              checked={completed}
              onChange={e => setCompleted(e.target.checked)}
            />
            Completed
          </label>
          <button type="submit">{editingId ? "Update" : "Add"}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>Cancel Edit</button>
          )}
        </fieldset>
      </form>

      <h2>Tasks</h2>
      {!loading && !error && tasks.length === 0 && <p>No tasks yet.</p>}
      {tasks.map(task => (
        <article key={task._id}>
          <p>Title: {task.title}</p>
          <p>Description: {task.description}</p>
          <p>{task.completed ? "Completed" : "Pending"}</p>
          <button onClick={() => handleEdit(task)} disabled={loading}>Edit</button>
          <button className="delete" onClick={() => handleDelete(task._id)} disabled={loading}>Delete</button>
        </article>
      ))}
    </main>
  );
}
