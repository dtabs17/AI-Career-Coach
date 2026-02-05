import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
import { Spinner, Alert, Button, Form } from "react-bootstrap";
import { FiMessageSquare, FiPlus, FiSend, FiX, FiEdit2, FiCheck, FiTrash2 } from "react-icons/fi";

function fmt(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function Chat() {
  const navigate = useNavigate();

  const [err, setErr] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [tabs, setTabs] = useState([]);
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");
  const [showSessions, setShowSessions] = useState(true);

  // rename state
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState("");
  const renameRef = useRef(null);

  // delete state
  const [deletingId, setDeletingId] = useState(null);

  function syncTabTitlesWithSessions(sessionList) {
    setTabs((prev) =>
      prev.map((t) => {
        const s = sessionList.find((x) => Number(x.id) === Number(t.id));
        if (!s) return t;
        return { ...t, title: s.title || t.title };
      })
    );
  }

  async function loadSessions({ selectFirst = true } = {}) {
    setErr("");
    setLoadingSessions(true);

    try {
      const list = await api("/api/chat/sessions");
      const arr = Array.isArray(list) ? list : [];
      setSessions(arr);

      syncTabTitlesWithSessions(arr);

      if (selectFirst) {
        const firstId = arr[0]?.id || null;
        setActiveId(firstId);

        if (firstId) {
          setTabs((prev) => {
            const exists = prev.some((t) => Number(t.id) === Number(firstId));
            if (exists) return prev;
            return [...prev, { id: firstId, title: arr[0]?.title || "New Chat" }];
          });

          await loadMessages(firstId);
        } else {
          setMessages([]);
          setTabs([]);
        }
      }
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setLoadingSessions(false);
    }
  }

  async function loadMessages(sessionId) {
    setErr("");
    setLoadingMessages(true);

    try {
      const data = await api(`/api/chat/sessions/${sessionId}/messages?limit=500`);
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function createSession() {
    setErr("");
    try {
      const s = await api("/api/chat/sessions", {
        method: "POST",
        body: JSON.stringify({ title: "New Chat" }),
      });

      await loadSessions({ selectFirst: false });

      setActiveId(s.id);
      setMessages([]);

      setTabs((prev) => {
        const exists = prev.some((t) => Number(t.id) === Number(s.id));
        if (exists) return prev;
        return [...prev, { id: s.id, title: s.title || "New Chat" }];
      });
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    }
  }

  async function openSession(sessionId) {
    setActiveId(sessionId);

    const title =
      sessions.find((s) => Number(s.id) === Number(sessionId))?.title || "New Chat";

    setTabs((prev) => {
      const exists = prev.some((t) => Number(t.id) === Number(sessionId));
      if (exists) return prev;
      return [...prev, { id: sessionId, title }];
    });

    await loadMessages(sessionId);
  }

  function closeTab(sessionId) {
    setTabs((prev) => prev.filter((t) => Number(t.id) !== Number(sessionId)));

    if (Number(activeId) === Number(sessionId)) {
      const remaining = tabs.filter((t) => Number(t.id) !== Number(sessionId));
      const next = remaining[remaining.length - 1]?.id || null;
      setActiveId(next);
      if (next) loadMessages(next);
      else setMessages([]);
    }
  }

  async function send(contentOverride) {
    const content = String(contentOverride ?? text ?? "").trim();
    if (!content) return;
    if (!activeId) return;

    setErr("");
    setSending(true);

    try {
      const out = await api(`/api/chat/sessions/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });

      setText("");

      const next = [];
      if (out?.user) next.push(out.user);
      if (out?.assistant) next.push(out.assistant);

      setMessages((prev) => [...(prev || []), ...next]);

      await loadSessions({ selectFirst: false });
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setSending(false);
    }
  }

  // rename
  function startRename(sessionId) {
    const current = sessions.find((s) => Number(s.id) === Number(sessionId));
    setRenamingId(sessionId);
    setRenameText(current?.title || "New Chat");
    setTimeout(() => renameRef.current?.focus(), 0);
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameText("");
  }

  async function commitRename(sessionId) {
    const title = String(renameText || "").trim();
    if (!title) return;

    setErr("");
    try {
      const updated = await api(`/api/chat/sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });

      setSessions((prev) =>
        (prev || []).map((s) =>
          Number(s.id) === Number(sessionId) ? { ...s, title: updated.title } : s
        )
      );

      setTabs((prev) =>
        (prev || []).map((t) =>
          Number(t.id) === Number(sessionId) ? { ...t, title: updated.title } : t
        )
      );

      cancelRename();
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    }
  }

  // delete session
  async function deleteSession(sessionId) {
    const ok = window.confirm("Delete this chat? This will remove the chat and all messages.");
    if (!ok) return;

    setErr("");
    setDeletingId(sessionId);

    try {
      await api(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });

      // remove locally first for instant UI update
      const nextSessions = (sessions || []).filter((s) => Number(s.id) !== Number(sessionId));
      setSessions(nextSessions);

      setTabs((prev) => (prev || []).filter((t) => Number(t.id) !== Number(sessionId)));

      if (Number(renamingId) === Number(sessionId)) cancelRename();

      // if deleting active chat, pick next
      if (Number(activeId) === Number(sessionId)) {
        const nextId = nextSessions[0]?.id || null;
        setActiveId(nextId);

        if (nextId) {
          await loadMessages(nextId);

          setTabs((prev) => {
            const exists = (prev || []).some((t) => Number(t.id) === Number(nextId));
            if (exists) return prev;
            const title = nextSessions.find((s) => Number(s.id) === Number(nextId))?.title || "New Chat";
            return [...(prev || []), { id: nextId, title }];
          });
        } else {
          setMessages([]);
        }
      }

      // sync ordering from server
      await loadSessions({ selectFirst: false });
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    loadSessions({ selectFirst: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emptyPrompts = [
    "Build me a 4-week learning roadmap for backend development.",
    "Review my CV bullets and rewrite them in a stronger way.",
    "Give me 10 interview questions for a junior software developer role.",
    "Based on my skills, what projects should I build next?",
  ];

  return (
    <div className={`chat-shell chat-embedded ${showSessions ? "" : "chat-no-sessions"}`}>
      {showSessions && (
        <aside className="chat-sidebar">
          <div className="chat-sidebar-top">
            <div className="chat-sidebar-title">Chats</div>
            <Button
              variant="outline-light"
              className="chat-new-btn"
              onClick={createSession}
              disabled={loadingSessions}
            >
              <FiPlus className="me-2" />
              New
            </Button>
          </div>

          {loadingSessions ? (
            <div className="chat-muted">
              <Spinner size="sm" className="me-2" /> Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="chat-muted">No chats yet. Click New.</div>
          ) : (
            <div className="chat-session-list">
              {sessions.map((s) => {
                const isActive = Number(s.id) === Number(activeId);
                const isRenaming = Number(renamingId) === Number(s.id);
                const isDeleting = Number(deletingId) === Number(s.id);

                return (
                  <button
                    key={s.id}
                    className={`chat-session ${isActive ? "is-active" : ""}`}
                    onClick={() => openSession(s.id)}
                    disabled={isDeleting}
                  >
                    {isRenaming ? (
                      <div
                        className="chat-session-rename-row"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Form.Control
                          ref={renameRef}
                          className="chat-session-rename-input"
                          value={renameText}
                          onChange={(e) => setRenameText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(s.id);
                            if (e.key === "Escape") cancelRename();
                          }}
                        />

                        <button
                          type="button"
                          className="chat-iconbtn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            commitRename(s.id);
                          }}
                          aria-label="Save title"
                          title="Save"
                        >
                          <FiCheck />
                        </button>

                        <button
                          type="button"
                          className="chat-iconbtn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelRename();
                          }}
                          aria-label="Cancel rename"
                          title="Cancel"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="chat-session-title">{s.title || "New Chat"}</div>
                        <div className="chat-session-meta">
                          {fmt(s.last_message_at || s.created_at)}
                        </div>

                        <button
                          type="button"
                          className="chat-session-edit"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startRename(s.id);
                          }}
                          aria-label="Rename chat"
                          title="Rename"
                        >
                          <FiEdit2 />
                        </button>

                        <button
                          type="button"
                          className="chat-session-delete"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteSession(s.id);
                          }}
                          aria-label="Delete chat"
                          title="Delete"
                          disabled={isDeleting}
                        >
                          {isDeleting ? <Spinner size="sm" /> : <FiTrash2 />}
                        </button>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>
      )}

      <main className="chat-main">
        <div className="chat-tabs">
          {!showSessions && (
            <Button
              variant="outline-light"
              size="sm"
              className="chat-new-btn-inline"
              onClick={createSession}
              disabled={loadingSessions}
            >
              <FiPlus className="me-2" />
              New
            </Button>
          )}

          <button
            type="button"
            className="chat-sessions-toggle"
            onClick={() => setShowSessions((v) => !v)}
            aria-label={showSessions ? "Hide chats list" : "Show chats list"}
            title={showSessions ? "Hide chats list" : "Show chats list"}
          >
            <FiMessageSquare />
          </button>

          {tabs.length === 0 ? (
            <div className="chat-tabs-empty">No chat opened</div>
          ) : (
            tabs.map((t) => {
              const active = Number(t.id) === Number(activeId);
              return (
                <button
                  key={t.id}
                  className={`chat-tab ${active ? "is-active" : ""}`}
                  onClick={() => openSession(t.id)}
                >
                  <span className="chat-tab-title">{t.title || "New Chat"}</span>
                  <span
                    className="chat-tab-close"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      closeTab(t.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") closeTab(t.id);
                    }}
                    aria-label="Close tab"
                    title="Close"
                  >
                    <FiX />
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="chat-body">
          {err ? <Alert variant="danger">{err}</Alert> : null}

          {!activeId ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">✿</div>
              <div className="chat-empty-title">Let’s chat! What’s on your mind?</div>
              <div className="chat-empty-sub">
                Choose a prompt below or start typing. I’ll help with whatever you need.
              </div>

              <div className="chat-empty-prompts">
                {emptyPrompts.map((p) => (
                  <button
                    key={p}
                    className="chat-prompt"
                    onClick={async () => {
                      if (!activeId) await createSession();
                      setText(p);
                      setTimeout(() => send(p), 0);
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : loadingMessages ? (
            <div className="chat-muted">
              <Spinner size="sm" className="me-2" /> Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">✿</div>
              <div className="chat-empty-title">Let’s chat! What’s on your mind?</div>
              <div className="chat-empty-sub">Try a prompt or ask a question to begin.</div>

              <div className="chat-empty-prompts">
                {emptyPrompts.map((p) => (
                  <button
                    key={p}
                    className="chat-prompt"
                    onClick={() => {
                      setText(p);
                      setTimeout(() => send(p), 0);
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-messages">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-msg ${m.role === "assistant" ? "is-ai" : "is-user"}`}
                >
                  <div className="chat-msg-head">
                    <div className="chat-msg-who">
                      {m.role === "assistant" ? "Coach" : "You"}
                    </div>
                    <div className="chat-msg-time">{fmt(m.created_at)}</div>
                  </div>
                  <div className="chat-msg-text">{m.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chat-inputbar">
          <Form
            className="chat-inputform"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Form.Control
              className="chat-input"
              placeholder="Ask something..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!activeId || sending}
            />

            <button
              type="submit"
              className="chat-send"
              disabled={!activeId || sending || !text.trim()}
              aria-label="Send"
              title="Send"
            >
              {sending ? <Spinner size="sm" /> : <FiSend />}
            </button>
          </Form>
        </div>
      </main>
    </div>
  );
}
