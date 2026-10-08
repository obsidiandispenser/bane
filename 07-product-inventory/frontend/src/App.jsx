import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3000/api/products";

export default function App() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setError("");
    try {
      const res = await fetch(API);
      if (!res.ok) {
        throw new Error("Could not load products");
      }
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function resetForm() {
    setName("");
    setPrice("");
    setQuantity("");
    setCategory("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const product = {
        name,
        price: Number(price),
        quantity: Number(quantity),
        category,
      };
      const res = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!res.ok) {
        throw new Error("Could not save product");
      }
      resetForm();
      await fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(product) {
    setName(product.name);
    setPrice(product.price);
    setQuantity(product.quantity);
    setCategory(product.category);
    setEditingId(product._id);
  }

  async function handleDelete(id) {
    setError("");
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Could not delete product");
      }
      if (editingId === id) {
        resetForm();
      }
      await fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>Product Inventory</h1>
      {error && <p className="error" role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit Product" : "Add Product"}</h2>
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
            type="number"
            min="0"
            step="any"
            placeholder="Price"
            aria-label="Price"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
          />
          <input
            type="number"
            min="0"
            step="1"
            placeholder="Quantity"
            aria-label="Quantity"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
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
          <button type="submit">{editingId ? "Update" : "Add"}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>Cancel Edit</button>
          )}
        </fieldset>
      </form>

      <h2>Products</h2>
      {!error && products.length === 0 && <p>No products yet.</p>}
      {products.map(product => (
        <article key={product._id}>
          <p>Name: {product.name}</p>
          <p>Price: {product.price}</p>
          <p>Quantity: {product.quantity}</p>
          <p>Category: {product.category}</p>
          <button onClick={() => handleEdit(product)}>Edit</button>
          <button className="delete" onClick={() => handleDelete(product._id)}>Delete</button>
        </article>
      ))}
    </main>
  );
}
