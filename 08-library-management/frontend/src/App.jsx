import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3000/api/books";

export default function App() {
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [available, setAvailable] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    setError("");
    try {
      const res = await fetch(API);
      if (!res.ok) {
        throw new Error("Could not load books");
      }
      const data = await res.json();
      setBooks(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function resetForm() {
    setTitle("");
    setAuthor("");
    setIsbn("");
    setAvailable(true);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const book = {
        title,
        author,
        isbn,
        available,
      };
      const res = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book),
      });
      if (!res.ok) {
        throw new Error("Could not save book");
      }
      resetForm();
      await fetchBooks();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(book) {
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn);
    setAvailable(book.available);
    setEditingId(book._id);
  }

  async function handleDelete(id) {
    setError("");
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Could not delete book");
      }
      if (editingId === id) {
        resetForm();
      }
      await fetchBooks();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>Library Management</h1>
      {error && <p className="error" role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit Book" : "Add Book"}</h2>
        <fieldset>
          <input
            type="text"
            placeholder="Title"
            aria-label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Author"
            aria-label="Author"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="ISBN"
            aria-label="ISBN"
            value={isbn}
            onChange={e => setIsbn(e.target.value)}
            required
          />
          <label>
            <input
              type="checkbox"
              checked={available}
              onChange={e => setAvailable(e.target.checked)}
            />
            Available
          </label>
          <button type="submit">{editingId ? "Update" : "Add"}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>Cancel Edit</button>
          )}
        </fieldset>
      </form>

      <h2>Books</h2>
      {!error && books.length === 0 && <p>No books yet.</p>}
      {books.map(book => (
        <article key={book._id}>
          <p>Title: {book.title}</p>
          <p>Author: {book.author}</p>
          <p>ISBN: {book.isbn}</p>
          <p>Available: {book.available ? "Yes" : "No"}</p>
          <button onClick={() => handleEdit(book)}>Edit</button>
          <button className="delete" onClick={() => handleDelete(book._id)}>Delete</button>
        </article>
      ))}
    </main>
  );
}
