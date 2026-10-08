import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3000/api/students";

export default function App() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [score, setScore] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [role, setRole] = useState("teacher");
  const [reportRoll, setReportRoll] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    const res = await fetch(API);
    const data = await res.json();
    setStudents(data);
  }

  function resetForm() {
    setName("");
    setRollNumber("");
    setSubject("");
    setScore("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const student = {
      name,
      rollNumber,
      subject,
      score: Number(score)
    };

    await fetch(editingId ? `${API}/${editingId}` : API, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student)
    });

    resetForm();
    fetchStudents();
  }

  function handleEdit(student) {
    setName(student.name);
    setRollNumber(student.rollNumber);
    setSubject(student.subject);
    setScore(student.score);
    setEditingId(student._id);
  }

  async function handleDelete(id) {
    await fetch(`${API}/${id}`, {
      method: "DELETE"
    });

    fetchStudents();
  }

  const visibleStudents = role === "teacher"
    ? students
    : students.filter(s => s.rollNumber === reportRoll.trim());

  return (
    <main>
      <h1>Student Performance Dashboard</h1>

      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
      </select>

      {role === "teacher" ? (
        <form onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit Student" : "Add Student"}</h2>

          <input
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <input
            placeholder="Roll Number"
            value={rollNumber}
            onChange={e => setRollNumber(e.target.value)}
            required
          />

          <input
            placeholder="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />

          <input
            type="number"
            min="0"
            max="100"
            placeholder="Score"
            value={score}
            onChange={e => setScore(e.target.value)}
            required
          />

          <button type="submit">
            {editingId ? "Update" : "Add"}
          </button>

          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </form>
      ) : (
        <input
          placeholder="Enter your roll number"
          value={reportRoll}
          onChange={e => setReportRoll(e.target.value)}
        />
      )}

      <h2>Performance Reports</h2>

      {visibleStudents.map(student => (
        <div key={student._id}>
          <h3>{student.name}</h3>
          <p>Roll Number: {student.rollNumber}</p>
          <p>Subject: {student.subject}</p>
          <p>Score: {student.score}</p>

          {role === "teacher" && (
            <>
              <button onClick={() => handleEdit(student)}>
                Edit
              </button>

              <button onClick={() => handleDelete(student._id)}>
                Delete
              </button>
            </>
          )}
        </div>
      ))}
    </main>
  );
}
