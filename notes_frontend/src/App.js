import React, { useState, useRef, useEffect } from "react";
import "./App.css";

// PUBLIC_INTERFACE
function App() {
  // Notes state: {id, title, content, lastEdited}
  const [notes, setNotes] = useState(() => {
    // Try as localStorage persistence
    const fromStorage = window.localStorage.getItem("notes");
    return fromStorage ? JSON.parse(fromStorage) : [];
  });
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [theme] = useState("light"); // Future: make dynamic theme
  const noteTitleInputRef = useRef(null);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    window.localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // Filtered notes by search term, sorted by most recent edit
  const filteredNotes = notes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.lastEdited - a.lastEdited);

  // Get currently selected note
  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  // PUBLIC_INTERFACE
  function handleNewNote() {
    const now = Date.now();
    const newNote = {
      id: `note_${now}`,
      title: "Untitled Note",
      content: "",
      lastEdited: now,
    };
    setNotes((n) => [newNote, ...n]);
    setSelectedNoteId(newNote.id);
    setIsEditing(true);
    setSidebarOpen(false);
    setTimeout(() => {
      noteTitleInputRef.current?.focus();
    }, 100);
  }

  // PUBLIC_INTERFACE
  function handleSelectNote(id) {
    setSelectedNoteId(id);
    setIsEditing(false);
    setSidebarOpen(false);
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    const rest = notes.filter((n) => n.id !== id);
    setNotes(rest);
    if (selectedNoteId === id) {
      setSelectedNoteId(rest.length > 0 ? rest[0].id : null);
      setIsEditing(false);
    }
  }

  // PUBLIC_INTERFACE
  function handleEditNote() {
    setIsEditing(true);
    setTimeout(() => {
      noteTitleInputRef.current?.focus();
    }, 100);
  }

  // PUBLIC_INTERFACE
  function handleSaveNoteChanges(fields) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNoteId
          ? { ...n, ...fields, lastEdited: Date.now() }
          : n
      )
    );
    setIsEditing(false);
  }

  // PUBLIC_INTERFACE
  function handleSearchChange(e) {
    setSearch(e.target.value);
  }

  // Keyboard shortcuts (Ctrl+N for new, Esc to close editor)
  useEffect(() => {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handleNewNote();
      } else if (e.key === "Escape") {
        setIsEditing(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [notes, selectedNoteId]);

  // Responsive sidebar toggling
  function handleSidebarToggle() {
    setSidebarOpen((o) => !o);
  }

  return (
    <div className="notes-root" data-theme={theme}>
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo" style={{ color: "var(--primary)" }}>
            <svg
              width={29}
              height={29}
              style={{ verticalAlign: "middle", marginRight: 6 }}
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect width="24" height="24" rx="5" fill="#1976D2" />
              <path
                d="M7 8.5V17a1 1 0 001 1h8"
                stroke="#FFCA28"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect
                x={8.5}
                y={6.5}
                width={7}
                height={4}
                rx={1.5}
                fill="#fff"
              />
            </svg>
            Notes
          </span>
        </div>
        <div className="navbar-right">
          <button className="new-note-btn" onClick={handleNewNote}>
            + New Note
          </button>
          <button
            className="sidebar-toggle-btn"
            onClick={handleSidebarToggle}
            aria-label="Open notes list"
          >
            <span>&#9776;</span>
          </button>
        </div>
      </nav>
      <main className="main-layout">
        {/* Sidebar Panel: List of notes & search */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={search}
              onChange={handleSearchChange}
              aria-label="Search notes"
            />
          </div>
          <ul className="notes-list">
            {filteredNotes.length === 0 && (
              <li className="notes-empty">No notes found.</li>
            )}
            {filteredNotes.map((note) => (
              <li
                key={note.id}
                className={
                  "notes-item" +
                  (note.id === selectedNoteId ? " selected" : "")
                }
                onClick={() => handleSelectNote(note.id)}
                tabIndex={0}
                aria-selected={note.id === selectedNoteId}
              >
                <div className="note-title">{note.title || "Untitled"}</div>
                <div className="note-snippet">
                  {(note.content || "")
                    .replace(/\n/g, " ")
                    .slice(0, 60)
                    .trim() + (note.content.length > 60 ? "..." : "")}
                </div>
                <div className="note-meta">
                  {new Date(note.lastEdited).toLocaleString()}
                  <button
                    className="delete-btn"
                    title="Delete note"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        {/* Main panel: Note details / Editor */}
        <section className="note-details">
          {!selectedNote && notes.length === 0 && (
            <div className="note-empty-message">
              <span className="empty-icon" role="img" aria-label="No note">
                📝
              </span>
              <p>No note selected.<br />Click "New Note" to get started!</p>
            </div>
          )}
          {selectedNote && (isEditing ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              onCancel={() => setIsEditing(false)}
              onSave={handleSaveNoteChanges}
              inputRef={noteTitleInputRef}
            />
          ) : (
            <NoteView
              note={selectedNote}
              onEdit={handleEditNote}
              onDelete={() => handleDeleteNote(selectedNote.id)}
            />
          ))}
        </section>
      </main>
      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          tabIndex={0}
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteEditor({ note, onSave, onCancel, inputRef }) {
  // Local copy of title/content to edit
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  // Save on Ctrl+S
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line
  }, [title, content]);
  function handleSave() {
    onSave({ title: title.trim(), content });
  }
  return (
    <form
      className="note-editor"
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      <input
        ref={inputRef}
        className="editor-title"
        aria-label="Note title"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={128}
        required
        autoFocus
        spellCheck
      />
      <textarea
        className="editor-content"
        aria-label="Note content"
        placeholder="Write your note here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        spellCheck
      />
      <div className="editor-toolbar">
        <button className="btn primary" type="submit">
          💾 Save
        </button>
        <button
          className="btn secondary"
          type="button"
          onClick={onCancel}
          style={{ marginLeft: 8 }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// PUBLIC_INTERFACE
function NoteView({ note, onEdit, onDelete }) {
  return (
    <div className="note-view">
      <div className="view-header">
        <h2 className="view-title">{note.title || "Untitled"}</h2>
        <div className="view-actions">
          <button
            className="btn primary"
            title="Edit"
            onClick={onEdit}
            aria-label="Edit note"
          >
            ✏️ Edit
          </button>
          <button
            className="btn secondary"
            title="Delete"
            onClick={onDelete}
            aria-label="Delete note"
            style={{ marginLeft: 10 }}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
      <div className="view-content">
        {note.content
          ? note.content
              .split("\n")
              .map((ln, idx) => <div key={idx}>{ln}</div>)
          : <span className="note-empty-content">This note is empty.</span>}
      </div>
      <div className="view-meta">
        <span>
          Last edited:{" "}
          {new Date(note.lastEdited).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default App;
