import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
import {
  Alert, CircularProgress, TextField, Tooltip, Box, Typography, Drawer,
} from "@mui/material";
import {
  Add, Send, Close, Edit, Check, Delete, ChatBubbleOutline, ContentCopy, Map, Description, QuestionAnswer, RocketLaunch,
} from "@mui/icons-material";
import AppIcon from "../components/AppIcon";

function fmt(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ""; }
}

const emptyPrompts = [
  { icon: <Map sx={{ fontSize: 16 }} />, label: "Build me a 4-week learning roadmap for backend development." },
  { icon: <Description sx={{ fontSize: 16 }} />, label: "Review my CV bullets and rewrite them in a stronger way." },
  { icon: <QuestionAnswer sx={{ fontSize: 16 }} />, label: "Give me 10 interview questions for a junior software developer." },
  { icon: <RocketLaunch sx={{ fontSize: 16 }} />, label: "Based on my skills, what projects should I build next?" },
];

function renderInline(text) {

  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} style={{ color: "rgba(241,240,255,0.95)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.82em",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 4,
          padding: "1px 5px",
          color: "#fcd34d",
        }}>{part.slice(1, -1)}</code>
      );
    return part;
  });
}

function MarkdownContent({ content }) {
  const lines = content.split("\n");
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];


    if (line.startsWith("```")) {
      const block = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        block.push(lines[i]);
        i++;
      }
      output.push(
        <Box key={i} component="pre" sx={{
          mt: 1, mb: 1, p: 1.5,
          bgcolor: "rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "6px",
          overflowX: "auto",
          fontSize: "0.80rem",
          fontFamily: "ui-monospace, monospace",
          color: "rgba(241,240,255,0.85)",
          lineHeight: 1.6,
          whiteSpace: "pre",
        }}>
          {block.join("\n")}
        </Box>
      );
      i++;
      continue;
    }


    const h3 = line.match(/^###\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h1 = line.match(/^#\s+(.*)/);
    if (h3) {
      output.push(
        <Typography key={i} sx={{ fontWeight: 700, fontSize: "0.875rem", mt: 1.5, mb: 0.5, color: "rgba(241,240,255,0.95)" }}>
          {renderInline(h3[1])}
        </Typography>
      );
      i++; continue;
    }
    if (h2) {
      output.push(
        <Typography key={i} sx={{ fontWeight: 750, fontSize: "0.9375rem", mt: 1.75, mb: 0.5, color: "rgba(241,240,255,0.97)" }}>
          {renderInline(h2[1])}
        </Typography>
      );
      i++; continue;
    }
    if (h1) {
      output.push(
        <Typography key={i} sx={{ fontWeight: 800, fontSize: "1rem", mt: 2, mb: 0.5, color: "#f1f0ff" }}>
          {renderInline(h1[1])}
        </Typography>
      );
      i++; continue;
    }


    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      output.push(<Box key={i} sx={{ borderTop: "1px solid rgba(255,255,255,0.10)", my: 1.5 }} />);
      i++; continue;
    }


    const indent = line.match(/^(\s*)/)[1].length;
    const indentPl = indent > 0 ? `${Math.min(indent, 4) * 6}px` : 0;
    const trimmed = line.trimStart();


    const cbUnchecked = trimmed.match(/^[-*]\s+\[\s\]\s+(.*)/);
    const cbChecked = trimmed.match(/^[-*]\s+\[x\]\s+(.*)/i);
    if (cbUnchecked || cbChecked) {
      const checked = Boolean(cbChecked);
      const label = checked ? cbChecked[1] : cbUnchecked[1];
      output.push(
        <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 0.75, mb: 0.4, pl: indentPl }}>
          <Box sx={{
            width: 15, height: 15, mt: "2px", flexShrink: 0,
            borderRadius: "3px",
            border: checked ? "1px solid rgba(34,197,94,0.60)" : "1px solid rgba(255,255,255,0.22)",
            bgcolor: checked ? "rgba(34,197,94,0.15)" : "transparent",
            display: "grid", placeItems: "center",
          }}>
            {checked && <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: "#22c55e" }} />}
          </Box>
          <Typography sx={{
            fontSize: "0.875rem", lineHeight: 1.55,
            color: checked ? "rgba(241,240,255,0.45)" : "rgba(241,240,255,0.88)",
            textDecoration: checked ? "line-through" : "none",
          }}>
            {renderInline(label)}
          </Typography>
        </Box>
      );
      i++; continue;
    }


    const bullet = trimmed.match(/^[-*]\s+(.*)/);
    if (bullet) {
      const isSubBullet = indent > 0;
      output.push(
        <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 0.75, mb: 0.3, pl: indentPl }}>
          <Box sx={{
            width: isSubBullet ? 3 : 4,
            height: isSubBullet ? 3 : 4,
            borderRadius: "50%",
            bgcolor: isSubBullet ? "rgba(241,240,255,0.30)" : "rgba(245,158,11,0.70)",
            flexShrink: 0,
            mt: isSubBullet ? "9px" : "8px",
          }} />
          <Typography sx={{ fontSize: "0.875rem", lineHeight: 1.55, color: "rgba(241,240,255,0.88)" }}>
            {renderInline(bullet[1])}
          </Typography>
        </Box>
      );
      i++; continue;
    }


    const numbered = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numbered) {
      output.push(
        <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 0.75, mb: 0.3 }}>
          <Typography sx={{ fontSize: "0.78rem", color: "rgba(245,158,11,0.70)", fontWeight: 700, minWidth: 18, mt: "1px", flexShrink: 0 }}>
            {numbered[1]}.
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", lineHeight: 1.55, color: "rgba(241,240,255,0.88)" }}>
            {renderInline(numbered[2])}
          </Typography>
        </Box>
      );
      i++; continue;
    }


    if (line.trim() === "") {
      output.push(<Box key={i} sx={{ height: "0.5em" }} />);
      i++; continue;
    }


    output.push(
      <Typography key={i} sx={{ fontSize: "0.875rem", lineHeight: 1.6, color: "rgba(241,240,255,0.90)", mb: 0.1 }}>
        {renderInline(line)}
      </Typography>
    );
    i++;
  }

  return <Box sx={{ display: "flex", flexDirection: "column" }}>{output}</Box>;
}



function CoachAvatar() {
  return <AppIcon size={30} />;
}



function MessageBubble({ message }) {
  const isUser = message.role !== "assistant";
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <Box sx={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-end",
      gap: 1,
      maxWidth: { xs: "92%", sm: "78%" },
      alignSelf: isUser ? "flex-end" : "flex-start",

      "& .copy-btn": { opacity: 0, transition: "opacity 120ms ease" },
      "&:hover .copy-btn": { opacity: 1 },
    }}>
      {!isUser && <CoachAvatar />}

      <Box sx={{
        px: 2, py: 1.5,
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser
          ? "rgba(245,158,11,0.14)"
          : "rgba(23,21,40,0.72)",
        border: isUser
          ? "1px solid rgba(245,158,11,0.28)"
          : "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        position: "relative",
      }}>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 3, mb: 0.5 }}>
          <Typography sx={{
            fontSize: "0.72rem",
            fontWeight: 700,

            color: isUser ? "rgba(245,158,11,0.90)" : "rgba(167,139,250,0.85)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            {isUser ? "You" : "Coach"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>

            {!isUser && (
              <Tooltip title={copied ? "Copied!" : "Copy"} arrow placement="top">
                <Box
                  className="copy-btn"
                  onClick={handleCopy}
                  sx={{
                    width: 22, height: 22,
                    display: "grid", placeItems: "center",
                    borderRadius: "5px",
                    cursor: "pointer",
                    color: copied ? "#86efac" : "rgba(241,240,255,0.35)",
                    bgcolor: "transparent",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.06)",
                      color: "rgba(241,240,255,0.70)",
                    },
                  }}
                >
                  <ContentCopy sx={{ fontSize: 12 }} />
                </Box>
              </Tooltip>
            )}
            <Typography sx={{ fontSize: "0.68rem", color: "rgba(241,240,255,0.32)", whiteSpace: "nowrap" }}>
              {fmt(message.created_at)}
            </Typography>
          </Box>
        </Box>

        {isUser ? (
          <Typography sx={{
            fontSize: "0.875rem",
            color: "rgba(241,240,255,0.90)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {message.content}
          </Typography>
        ) : (
          <MarkdownContent content={message.content} />
        )}
      </Box>
    </Box>
  );
}



function EmptyState({ onPrompt, coachContext }) {
  const contextPills = coachContext ? [
    coachContext.name && { label: coachContext.name },
    coachContext.skillCount > 0 && { label: `${coachContext.skillCount} skill${coachContext.skillCount !== 1 ? "s" : ""} in your profile` },
    ...(coachContext.preferredRoles.map((r) => ({ label: r }))),
    coachContext.course && { label: coachContext.course },
  ].filter(Boolean) : [];

  return (
    <Box sx={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      px: 3,
      py: 4,
      textAlign: "center",
    }}>
      <Box sx={{
        mb: 2.5,
      }}>
        <AppIcon size={52} />
      </Box>

      <Typography sx={{ fontSize: "1.25rem", fontWeight: 750, letterSpacing: "-0.02em", mb: 0.75 }}>
        What's on your mind?
      </Typography>
      <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", maxWidth: 480, mb: contextPills.length > 0 ? 2 : 3.5 }}>
        I'm your AI career coach. Ask me anything about your skills, career path, or interview prep.
      </Typography>

      {contextPills.length > 0 && (
        <Box sx={{ mb: 3.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <Typography sx={{
            fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.07em",
            textTransform: "uppercase", color: "rgba(241,240,255,0.28)",
          }}>
            Your coach already knows
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "center", maxWidth: 480 }}>
            {contextPills.map(({ label }) => (
              <Box key={label} sx={{
                px: 1.25, py: 0.4,
                borderRadius: "6px",
                border: "1px solid rgba(245,158,11,0.25)",
                bgcolor: "rgba(245,158,11,0.06)",
              }}>
                <Typography sx={{ fontSize: "0.775rem", color: "rgba(245,158,11,0.90)", fontWeight: 550 }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        gap: 1.25,
        width: "100%",
        maxWidth: 560,
      }}>
        {emptyPrompts.map((p) => (
          <Box
            key={p.label}
            onClick={() => onPrompt(p.label)}
            sx={{
              px: 2, py: 1.75,
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.08)",
              bgcolor: "rgba(255,255,255,0.02)",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              gap: 1.5,
              alignItems: "flex-start",
              transition: "all 120ms ease",
              "&:hover": {
                border: "1px solid rgba(245,158,11,0.25)",
                bgcolor: "rgba(245,158,11,0.05)",
              },
            }}
          >
            <Box sx={{ color: "rgba(245,158,11,0.70)", flexShrink: 0, mt: "1px", display: "flex" }}>{p.icon}</Box>
            <Typography sx={{ fontSize: "0.8125rem", color: "rgba(241,240,255,0.78)", lineHeight: 1.45 }}>
              {p.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}



export default function Chat() {
  const navigate = useNavigate();

  const [err, setErr] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showSessions, setShowSessions] = useState(false);

  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState("");
  const renameRef = useRef(null);
  const [deletingId, setDeletingId] = useState(null);

  const [coachContext, setCoachContext] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [profile, userSkills] = await Promise.all([
          api("/api/profile"),
          api("/api/user-skills"),
        ]);
        const skills = Array.isArray(userSkills) ? userSkills : [];
        setCoachContext({
          name: profile?.full_name || null,
          skillCount: skills.length,
          preferredRoles: Array.isArray(profile?.preferred_roles) && profile.preferred_roles.length > 0
            ? profile.preferred_roles.slice(0, 2)
            : [],
          course: profile?.course || null,
        });
      } catch {
        //
      }
    })();
  }, []);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function loadSessions({ selectFirst = true } = {}) {
    setErr("");
    setLoadingSessions(true);
    try {
      const list = await api("/api/chat/sessions");
      const arr = Array.isArray(list) ? list : [];
      setSessions(arr);
      if (selectFirst) {
        const firstId = arr[0]?.id || null;
        setActiveId(firstId);
        if (firstId) await loadMessages(firstId);
        else setMessages([]);
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
      return s.id;
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
      return null;
    }
  }

  async function openSession(sessionId) {
    if (Number(sessionId) === Number(activeId)) return;
    setActiveId(sessionId);
    await loadMessages(sessionId);
  }

  async function send(contentOverride) {
    const content = String(contentOverride ?? text ?? "").trim();
    if (!content) return;

    let sessionId = activeId;
    if (!sessionId) {
      sessionId = await createSession();
      if (!sessionId) return;
    }

    setErr("");
    setSending(true);
    window.onbeforeunload = () => "The coach is still writing a response.";
    try {
      const out = await api(`/api/chat/sessions/${sessionId}/messages`, {
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
      window.onbeforeunload = null;
    }
  }

  function startRename(sessionId) {
    const current = sessions.find((s) => Number(s.id) === Number(sessionId));
    setRenamingId(sessionId);
    setRenameText(current?.title || "New Chat");
    setTimeout(() => renameRef.current?.focus(), 0);
  }

  function cancelRename() { setRenamingId(null); setRenameText(""); }

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
        (prev || []).map((s) => Number(s.id) === Number(sessionId) ? { ...s, title: updated.title } : s)
      );
      cancelRename();
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    }
  }

  async function deleteSession(sessionId) {
    const ok = window.confirm("Delete this chat? This will remove the chat and all messages.");
    if (!ok) return;
    setErr("");
    setDeletingId(sessionId);
    try {
      await api(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
      const nextSessions = sessions.filter((s) => Number(s.id) !== Number(sessionId));
      setSessions(nextSessions);
      if (Number(activeId) === Number(sessionId)) {
        const nextId = nextSessions[0]?.id || null;
        setActiveId(nextId);
        if (nextId) await loadMessages(nextId);
        else setMessages([]);
      }
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

  }, []);

  const activeSession = sessions.find((s) => Number(s.id) === Number(activeId));

  return (
    <div className="chat-shell chat-embedded">

      <Drawer
        anchor="left"
        open={showSessions}
        onClose={() => setShowSessions(false)}
        sx={{
          zIndex: 1400,
          "& .MuiDrawer-paper": {
            width: 280,
            bgcolor: "#0a090f",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            backgroundImage: "none",
            p: "12px",
            display: "flex",
            flexDirection: "column",
          },
          "& .MuiBackdrop-root": {
            bgcolor: "rgba(0,0,0,0.50)",
          },
        }}
      >
        <div className="chat-sidebar-top">
          <span className="chat-sidebar-title">Chats</span>
          <Box
            component="button"
            type="button"
            onClick={() => { createSession(); setShowSessions(false); }}
            disabled={loadingSessions}
            sx={{
              display: "inline-flex", alignItems: "center", gap: 0.5,
              height: 34, px: 1.5, borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.09)",
              bgcolor: "rgba(255,255,255,0.03)",
              color: "rgba(241,240,255,0.80)",
              cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
              fontFamily: "Manrope, system-ui, sans-serif",
              transition: "all 120ms ease",
              "&:hover": {
                bgcolor: "rgba(245,158,11,0.07)",
                border: "1px solid rgba(245,158,11,0.22)",
                color: "#fcd34d",
              },
              "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
            }}
          >
            <Add style={{ fontSize: 15 }} />
            New
          </Box>
        </div>

        {loadingSessions ? (
          <div className="chat-muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CircularProgress size={12} sx={{ color: "rgba(241,240,255,0.45)" }} />
            Loading...
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
                <div
                  key={s.id}
                  className={`chat-session ${isActive ? "is-active" : ""}`}
                  onClick={() => { openSession(s.id); setShowSessions(false); }}
                  role="button"
                  aria-disabled={isDeleting}
                >
                  {isRenaming ? (
                    <div className="chat-session-rename-row" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={renameRef}
                        className="chat-session-rename-input"
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(s.id);
                          if (e.key === "Escape") cancelRename();
                        }}
                      />
                      <button type="button" className="chat-iconbtn"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); commitRename(s.id); }}>
                        <Check style={{ fontSize: 13 }} />
                      </button>
                      <button type="button" className="chat-iconbtn"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); cancelRename(); }}>
                        <Close style={{ fontSize: 13 }} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="chat-session-title">{s.title || "New Chat"}</div>
                      <div className="chat-session-meta">{fmt(s.last_message_at || s.created_at)}</div>
                      <button type="button" className="chat-session-edit"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); startRename(s.id); }}
                        aria-label="Rename" title="Rename">
                        <Edit style={{ fontSize: 13 }} />
                      </button>
                      <button type="button" className="chat-session-delete"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteSession(s.id); }}
                        aria-label="Delete" title="Delete" disabled={isDeleting}>
                        {isDeleting
                          ? <CircularProgress size={12} sx={{ color: "rgba(241,240,255,0.45)" }} />
                          : <Delete style={{ fontSize: 13 }} />
                        }
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Drawer>
      

      <main className="chat-main" style={{ position: "relative" }}>

        <Box sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2, gap: 2,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          bgcolor: "rgba(12,11,15,0.25)",
          backdropFilter: "blur(12px)",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <Tooltip title={showSessions ? "Hide sidebar" : "Show sidebar"} arrow>
              <Box onClick={() => setShowSessions((v) => !v)} sx={{
                width: 32, height: 32, borderRadius: "8px",
                display: "grid", placeItems: "center", flexShrink: 0,
                border: showSessions ? "1px solid rgba(245,158,11,0.20)" : "1px solid rgba(255,255,255,0.08)",
                bgcolor: showSessions ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)",
                color: showSessions ? "#fcd34d" : "rgba(241,240,255,0.65)",
                cursor: "pointer",
                transition: "all 120ms ease",
                "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(241,240,255,0.95)" },
              }}>
                <ChatBubbleOutline style={{ fontSize: 15 }} />
              </Box>
            </Tooltip>

            <Typography sx={{
              fontWeight: 650, fontSize: "0.875rem",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              color: activeSession ? "rgba(241,240,255,0.88)" : "rgba(241,240,255,0.30)",
            }}>
              {activeSession?.title || "No chat selected"}
            </Typography>
          </Box>

          <Box component="button" type="button" onClick={createSession} sx={{
            display: "inline-flex", alignItems: "center", gap: 0.75,
            height: 32, px: 1.5, borderRadius: "8px", flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.09)",
            bgcolor: "rgba(255,255,255,0.03)",
            color: "rgba(241,240,255,0.75)",
            cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
            fontFamily: "Manrope, system-ui, sans-serif",
            transition: "all 120ms ease",
            "&:hover": {
              bgcolor: "rgba(245,158,11,0.07)",
              border: "1px solid rgba(245,158,11,0.22)",
              color: "#fcd34d",
            },
          }}>
            <Add style={{ fontSize: 15 }} />
            New chat
          </Box>
        </Box>

        <Box className="chat-body" sx={{ display: "flex", flexDirection: "column" }}>
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

          {!activeId ? (
            <EmptyState coachContext={coachContext} onPrompt={async (p) => {
              const id = await createSession();
              if (!id) return;
              setText(p);
              setTimeout(() => send(p), 80);
            }} />
          ) : loadingMessages ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 1.5 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>Loading messages...</Typography>
            </Box>
          ) : messages.length === 0 ? (
            <EmptyState coachContext={coachContext} onPrompt={(p) => { setText(p); setTimeout(() => send(p), 0); }} />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75, px: 1, py: 0.5 }}>
              {messages.map((m) => <MessageBubble key={m.id} message={m} />)}

              {sending && (
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, alignSelf: "flex-start" }}>
                  <CoachAvatar />
                  <Box sx={{
                    px: 2.5, py: 1.5,
                    borderRadius: "18px 18px 18px 4px",
                    bgcolor: "rgba(23,21,40,0.72)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex", gap: 0.75, alignItems: "center",
                  }}>
                    {[0, 1, 2].map((i) => (
                      <Box key={i} sx={{
                        width: 7, height: 7, borderRadius: "50%",
                        bgcolor: "rgba(241,240,255,0.40)",
                        animation: "dotPulse 1.2s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`,
                        "@keyframes dotPulse": {
                          "0%, 100%": { opacity: 0.3, transform: "scale(0.85)" },
                          "50%": { opacity: 1, transform: "scale(1.1)" },
                        },
                      }} />
                    ))}
                  </Box>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>
          )}
        </Box>

        <Box sx={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          bgcolor: "rgba(12,11,15,0.25)",
          backdropFilter: "blur(12px)",
          px: 2, py: 1.5,
          display: "flex",
          alignItems: "flex-end",
          gap: 1.5,
        }}>
          <TextField
            placeholder="Ask something..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            multiline
            maxRows={5}
            fullWidth
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(23,21,40,0.65)",
                borderRadius: "10px",
                alignItems: "flex-end",
                "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.16)" },
                "&.Mui-focused fieldset": { borderColor: "rgba(245,158,11,0.45)" },
              },
              "& .MuiInputBase-input": { color: "#f1f0ff", py: 1.25, fontSize: "0.875rem" },
              "& .MuiInputBase-input::placeholder": { color: "rgba(241,240,255,0.30)", opacity: 1 },
            }}
          />

          <Box
            component="button"
            type="button"
            onClick={() => send()}
            disabled={sending || !text.trim()}
            sx={{
              width: 42, height: 42, borderRadius: "10px",
              display: "grid", placeItems: "center", flexShrink: 0,
              background: text.trim() && !sending
                ? "linear-gradient(135deg, #f59e0b, #fb923c)"
                : "rgba(255,255,255,0.06)",
              border: "none",
              color: text.trim() && !sending ? "#0c0b0f" : "rgba(241,240,255,0.28)",
              cursor: text.trim() && !sending ? "pointer" : "not-allowed",
              transition: "all 120ms ease",
              "&:not([disabled]):hover": { filter: "brightness(1.08)" },
            }}
          >
            {sending
              ? <CircularProgress size={16} sx={{ color: "rgba(241,240,255,0.55)" }} />
              : <Send style={{ fontSize: 16 }} />
            }
          </Box>
        </Box>
      </main>
    </div>
  );
}