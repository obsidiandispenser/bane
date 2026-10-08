import React, { useEffect, useState } from "react";
import "./App.css";

// CHANGE 6: API URL
const API = "http://localhost:3000/api/tasks";

export default function App() {
  const [tasks, setTasks] = useState([]);
  // CHANGE 2: Form state
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
      const response = await fetch(API);
      if (!response.ok) {
        throw new Error(`Could not load tasks (${response.status}).`);
      }
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(`Could not load tasks. ${err.message}`);
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

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // CHANGE 4: Request body
      const body = { title: title.trim(), description, completed };
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Could not save task (${response.status}).`);
      }
      resetForm();
      await fetchTasks();
    } catch (err) {
      setError(`Could not save task. ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(task) {
    setTitle(task.title);
    setDescription(task.description);
    setCompleted(task.completed);
    setEditingId(task._id);
    setError("");
    document.getElementById("task-title").focus();
  }

  async function handleDelete(id) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Could not delete task (${response.status}).`);
      }
      // DELETE returns 204, so there is no JSON body to read on success.
      if (editingId === id) resetForm();
      await fetchTasks();
    } catch (err) {
      setError(`Could not delete task. ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <p className="eyebrow">YOUR DAILY WORKSPACE</p>
          {/* CHANGE 1: Application title */}
          <h1>Task Manager</h1>
          <p className="subtitle">A little structure for everything you need to do.</p>
        </div>
        <span className="task-count">{tasks.length} tasks</span>
      </header>

      {error && <div className="error" role="alert">{error}</div>}
      {loading && <p className="loading" role="status">Loading — please wait…</p>}

      <main className="workspace" aria-busy={loading}>
        <section className="panel form-panel" aria-labelledby="form-heading">
          <p className="eyebrow">MAKE IT HAPPEN</p>
          <h2 id="form-heading">{editingId ? "Edit task" : "Create a task"}</h2>
          <p className="section-note">Give your next step a name.</p>
          <form onSubmit={handleSubmit}>
            <fieldset disabled={loading}>
              {/* CHANGE 3: Form inputs */}
              <label htmlFor="task-title">Title <span className="required">*</span></label>
              <input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What needs to get done?"
                required
              />
              <label htmlFor="task-description">Description</label>
              <textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add a few helpful details…"
                rows={4}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(event) => setCompleted(event.target.checked)}
                />
                Mark as completed
              </label>
              <button className="primary" type="submit">
                {editingId ? "Save changes" : "Add task"}
              </button>
              {editingId && (
                <button className="cancel" type="button" onClick={resetForm}>Cancel Edit</button>
              )}
            </fieldset>
          </form>
        </section>

        <section className="panel list-panel" aria-labelledby="list-heading">
          <div className="list-header">
            <h2 id="list-heading">Your tasks</h2>
            <button className="refresh" type="button" onClick={fetchTasks} disabled={loading}>
              Refresh
            </button>
          </div>
          <p className="section-note">Small steps. Steady progress.</p>
          {!loading && !error && tasks.length === 0 && (
            <div className="empty">
              <span className="empty-icon" aria-hidden="true">✓</span>
              <h3>A fresh start</h3>
              <p>Add your first task using the form.</p>
            </div>
          )}
          <ul className="task-list">
            {tasks.map((task) => (
              <li className="task" key={task._id}>
                {/* CHANGE 5: Display fields */}
                <div className="task-heading">
                  <h3>{task.title}</h3>
                  <span className={`status ${task.completed ? "completed" : "pending"}`}>
                    {task.completed ? "Completed" : "Pending"}
                  </span>
                </div>
                <p className="description">{task.description || "No description added."}</p>
                <div className="task-actions">
                  <button type="button" onClick={() => handleEdit(task)} disabled={loading}>
                    Edit
                  </button>
                  <button className="delete" type="button" onClick={() => handleDelete(task._id)} disabled={loading}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
