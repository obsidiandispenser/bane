import React, { createContext, useContext, useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3000/api/posts";
const ForumContext = createContext(null);

export default function App() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setError("");
    try {
      const res = await fetch(API);
      if (!res.ok) {
        throw new Error("Could not load posts");
      }
      setPosts(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }

  function resetForm() {
    setTitle("");
    setContent("");
    setAuthor("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const post = { title, content, author };
      const res = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      });
      if (!res.ok) {
        throw new Error("Could not save post");
      }
      resetForm();
      await fetchPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(post) {
    setTitle(post.title);
    setContent(post.content);
    setAuthor(post.author);
    setEditingId(post._id);
  }

  async function handleDelete(id) {
    setError("");
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Could not delete post");
      }
      if (editingId === id) {
        resetForm();
      }
      await fetchPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addComment(postId, author, text) {
    setError("");
    try {
      const res = await fetch(`${API}/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, text }),
      });
      if (!res.ok) {
        throw new Error("Could not add comment");
      }
      await fetchPosts();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  return (
    <ForumContext.Provider value={{ posts, handleEdit, handleDelete, addComment }}>
      <main>
        <h1>Discussion Forum</h1>
        {error && <p className="error" role="alert">{error}</p>}
        <form onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit Post" : "Add Post"}</h2>
          <input placeholder="Title" aria-label="Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <input placeholder="Author" aria-label="Author" value={author} onChange={e => setAuthor(e.target.value)} required />
          <textarea placeholder="Content" aria-label="Content" value={content} onChange={e => setContent(e.target.value)} required />
          <button type="submit">{editingId ? "Update" : "Add"}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancel Edit</button>}
        </form>
        <h2>Posts</h2>
        {!error && posts.length === 0 && <p>No posts yet.</p>}
        <PostList />
      </main>
    </ForumContext.Provider>
  );
}

function PostList() {
  const { posts, handleEdit, handleDelete } = useContext(ForumContext);

  return posts.map(post => (
    <article key={post._id}>
      <h3>{post.title}</h3>
      <p>By {post.author}</p>
      <p className="details">{post.content}</p>
      <button onClick={() => handleEdit(post)}>Edit</button>
      <button className="delete" onClick={() => handleDelete(post._id)}>Delete</button>
      <h4>Comments</h4>
      {post.comments.length === 0 && <p>No comments yet.</p>}
      {post.comments.map(comment => (
        <p key={comment._id}><strong>{comment.author}: </strong>{comment.text}</p>
      ))}
      <CommentForm postId={post._id} />
    </article>
  ));
}

function CommentForm({ postId }) {
  const { addComment } = useContext(ForumContext);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const saved = await addComment(postId, author, text);
    if (saved) {
      setAuthor("");
      setText("");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Your name" aria-label="Comment author" value={author} onChange={e => setAuthor(e.target.value)} required />
      <input placeholder="Comment" aria-label="Comment" value={text} onChange={e => setText(e.target.value)} required />
      <button type="submit">Add Comment</button>
    </form>
  );
}
