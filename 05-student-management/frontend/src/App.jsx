import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3000/api/students";

export default function App() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [course, setCourse] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setError("");
    try {
      const res = await fetch(API);
      if (!res.ok) {
        throw new Error("Could not load students");
      }
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function resetForm() {
    setName("");
    setRollNumber("");
    setCourse("");
    setEmail("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const student = {
        name,
        rollNumber,
        course,
        email,
      };
      const res = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });
      if (!res.ok) {
        throw new Error("Could not save student");
      }
      resetForm();
      await fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(student) {
    setName(student.name);
    setRollNumber(student.rollNumber);
    setCourse(student.course);
    setEmail(student.email);
    setEditingId(student._id);
  }

  async function handleDelete(id) {
    setError("");
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Could not delete student");
      }
      if (editingId === id) {
        resetForm();
      }
      await fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>Student Management</h1>
      {error && <p className="error" role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit Student" : "Add Student"}</h2>
        <fieldset>
          <input
            type="text"
            placeholder="Name"
            aria-label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Roll Number"
            aria-label="Roll Number"
            value={rollNumber}
            onChange={e => setRollNumber(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Course"
            aria-label="Course"
            value={course}
            onChange={e => setCourse(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            aria-label="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit">{editingId ? "Update" : "Add"}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>Cancel Edit</button>
          )}
        </fieldset>
      </form>

      <h2>Students</h2>
      {!error && students.length === 0 && <p>No students yet.</p>}
      {students.map(student => (
        <article key={student._id}>
          <p>Name: {student.name}</p>
          <p>Roll Number: {student.rollNumber}</p>
          <p>Course: {student.course}</p>
          <p>Email: {student.email}</p>
          <button onClick={() => handleEdit(student)}>Edit</button>
          <button className="delete" onClick={() => handleDelete(student._id)}>Delete</button>
        </article>
      ))}
    </main>
  );
}
