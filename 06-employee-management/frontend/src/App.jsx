import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3000/api/employees";

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    setError("");
    try {
      const res = await fetch(API);
      if (!res.ok) {
        throw new Error("Could not load employees");
      }
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function resetForm() {
    setName("");
    setDepartment("");
    setRole("");
    setSalary("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const employee = {
        name,
        department,
        role,
        salary: Number(salary),
      };
      const res = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });
      if (!res.ok) {
        throw new Error("Could not save employee");
      }
      resetForm();
      await fetchEmployees();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(employee) {
    setName(employee.name);
    setDepartment(employee.department);
    setRole(employee.role);
    setSalary(employee.salary);
    setEditingId(employee._id);
  }

  async function handleDelete(id) {
    setError("");
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Could not delete employee");
      }
      if (editingId === id) {
        resetForm();
      }
      await fetchEmployees();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>Employee Management</h1>
      {error && <p className="error" role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit Employee" : "Add Employee"}</h2>
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
            placeholder="Department"
            aria-label="Department"
            value={department}
            onChange={e => setDepartment(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Role"
            aria-label="Role"
            value={role}
            onChange={e => setRole(e.target.value)}
            required
          />
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Salary"
            aria-label="Salary"
            value={salary}
            onChange={e => setSalary(e.target.value)}
            required
          />
          <button type="submit">{editingId ? "Update" : "Add"}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>Cancel Edit</button>
          )}
        </fieldset>
      </form>

      <h2>Employees</h2>
      {!error && employees.length === 0 && <p>No employees yet.</p>}
      {employees.map(employee => (
        <article key={employee._id}>
          <p>Name: {employee.name}</p>
          <p>Department: {employee.department}</p>
          <p>Role: {employee.role}</p>
          <p>Salary: {employee.salary}</p>
          <button onClick={() => handleEdit(employee)}>Edit</button>
          <button className="delete" onClick={() => handleDelete(employee._id)}>Delete</button>
        </article>
      ))}
    </main>
  );
}
