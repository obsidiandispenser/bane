import React, { createContext, useContext, useEffect, useState } from "react";
import "./App.css";
// CHANGE 6: API URL
const API = "http://localhost:3000/api/posts";
const ForumContext = createContext(null);

export default function App() {
  const [posts, setPosts] = useState([]);
  // CHANGE 2: Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { fetchPosts(); }, []);
  async function fetchPosts() {
    setLoading(true); setError("");
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Could not load posts");
      setPosts(await response.json());
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  function resetForm() { setTitle(""); setContent(""); setAuthor(""); setEditingId(null); }
  async function handleSubmit(event) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      // CHANGE 4: Request body
      const body = { title, content, author };
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Could not save post"); }
      resetForm(); await fetchPosts();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  function handleEdit(post) {
    setTitle(post.title); setContent(post.content); setAuthor(post.author); setEditingId(post._id); setError("");
  }
  async function handleDelete(id) {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Could not delete post"); }
      if (editingId === id) resetForm();
      await fetchPosts();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  async function addComment(postId, commentAuthor, text) {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/${postId}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ author: commentAuthor, text }),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Could not add comment"); }
      await fetchPosts(); return true;
    } catch (err) { setError(err.message); return false; } finally { setLoading(false); }
  }
  // Posts and mutations are shared through Context with the post list and comment forms.
  return <ForumContext.Provider value={{ posts, loading, error, handleEdit, handleDelete, addComment }}>
    <main>
      {/* CHANGE 1: Application title */}
      <header><h1>Discussion Forum</h1><p>Share an idea and join the discussion.</p></header>
      {error && <p className="error" role="alert">{error}</p>}{loading && <p role="status">Loading…</p>}
      <div className="layout">
        <section><h2>{editingId ? "Edit post" : "Create post"}</h2>
          <form onSubmit={handleSubmit}><fieldset disabled={loading}>
            {/* CHANGE 3: Form inputs */}
            <label htmlFor="title">Title</label><input id="title" value={title} onChange={event => setTitle(event.target.value)} required />
            <label htmlFor="author">Author</label><input id="author" value={author} onChange={event => setAuthor(event.target.value)} required />
            <label htmlFor="content">Content</label><textarea id="content" value={content} onChange={event => setContent(event.target.value)} required />
            <button>{editingId ? "Save changes" : "Publish post"}</button>{editingId && <button className="secondary" type="button" onClick={resetForm}>Cancel Edit</button>}
          </fieldset></form>
        </section>
        <section><h2>Discussions</h2><button className="secondary" onClick={fetchPosts} disabled={loading}>Refresh</button><PostList /></section>
      </div>
    </main>
  </ForumContext.Provider>;
}
function PostList() {
  const { posts, loading, error, handleEdit, handleDelete } = useContext(ForumContext);
  return <>
    {!loading && !error && posts.length === 0 && <p>No posts yet. Start a discussion.</p>}
    {posts.map(post => <article key={post._id}>
      {/* CHANGE 5: Display fields */}
      <h3>{post.title}</h3><p className="muted">By {post.author}</p><p className="details">{post.content}</p>
      <button onClick={() => handleEdit(post)} disabled={loading}>Edit</button><button className="delete" onClick={() => handleDelete(post._id)} disabled={loading}>Delete</button>
      <h4>Comments ({post.comments.length})</h4>
      {post.comments.length === 0 && <p>No comments yet.</p>}
      <ul>{post.comments.map(comment => <li key={comment._id}><strong>{comment.author}: </strong>{comment.text}</li>)}</ul>
      <CommentForm postId={post._id} />
    </article>)}
  </>;
}
function CommentForm({ postId }) {
  const { addComment, loading } = useContext(ForumContext);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  async function handleSubmit(event) {
    event.preventDefault();
    const saved = await addComment(postId, author, text);
    if (saved) { setAuthor(""); setText(""); }
  }
  return <form onSubmit={handleSubmit}><fieldset disabled={loading}>
    <label htmlFor={`author-${postId}`}>Your name</label><input id={`author-${postId}`} value={author} onChange={event => setAuthor(event.target.value)} required />
    <label htmlFor={`comment-${postId}`}>Comment</label><textarea id={`comment-${postId}`} value={text} onChange={event => setText(event.target.value)} required />
    <button>Add comment</button>
  </fieldset></form>;
}
