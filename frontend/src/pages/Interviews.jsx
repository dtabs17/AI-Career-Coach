import { useEffect, useState, useRef } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
import { keyframes } from "@emotion/react";
import {
  Box, Paper, Typography, Button, IconButton, TextField,
  Select, MenuItem, FormControl, InputLabel, RadioGroup,
  Radio, FormControlLabel, Chip, LinearProgress, Alert,
  CircularProgress, Divider, Tooltip, Stack,
} from "@mui/material";
import {
  PlayArrow, Pause, Stop, Mic, MicOff, Delete,
  Visibility, CheckCircle, AccessTime, EmojiEvents,
} from "@mui/icons-material";

const pulseAnim = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
`;

function fmt(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ""; }
}

function getRatingLabel(rating) {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Very Good";
  if (rating >= 2.5) return "Good";
  if (rating >= 1.5) return "Fair";
  return "Needs Improvement";
}

function getRatingChipSx(rating) {
  if (rating >= 4.5) return { bgcolor: "rgba(34,197,94,0.13)", color: "#86efac", border: "1px solid rgba(34,197,94,0.22)" };
  if (rating >= 3.5) return { bgcolor: "rgba(59,130,246,0.13)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.22)" };
  if (rating >= 2.5) return { bgcolor: "rgba(245,158,11,0.13)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.22)" };
  return { bgcolor: "rgba(239,68,68,0.13)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.22)" };
}

const modeChipSx = {
  technical: { bgcolor: "rgba(59,130,246,0.12)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.22)" },
  behavioral: { bgcolor: "rgba(167,139,250,0.12)", color: "#c4b5fd", border: "1px solid rgba(167,139,250,0.22)" },
  mixed: { bgcolor: "rgba(245,158,11,0.12)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.22)" },
};

const sectionLabel = {
  color: "text.secondary",
  fontWeight: 650,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontSize: "0.70rem",
  mb: 1,
};

export default function Interviews() {
  const navigate = useNavigate();

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [roles, setRoles] = useState([]);

  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedMode, setSelectedMode] = useState("mixed");
  const [totalQuestions, setTotalQuestions] = useState(5);

  const [activeSession, setActiveSession] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [pendingNextTurn, setPendingNextTurn] = useState(null);
  const [answer, setAnswer] = useState("");
  const [allTurns, setAllTurns] = useState([]);
  const [reviewSession, setReviewSession] = useState(null);

  const recognitionRef = useRef(null);
  const charIndexRef = useRef(0);
  const currentQuestionRef = useRef("");

  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [ttsPaused, setTtsPaused] = useState(false);
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");

  useEffect(() => { loadSessions(); loadRoles(); }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setVoiceSupported(true);
    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoices(v);
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  function speakFrom(text, fromChar) {
    window.speechSynthesis?.cancel();
    const slice = text.slice(fromChar);
    if (!slice.trim()) return;
    const utt = new SpeechSynthesisUtterance(slice);
    utt.rate = 0.9;
    utt.pitch = 1.05;
    const allVoices = window.speechSynthesis.getVoices();
    const chosen = selectedVoiceName
      ? allVoices.find((v) => v.name === selectedVoiceName)
      : allVoices.find((v) => /google|natural|enhanced|samantha|karen|daniel/i.test(v.name));
    if (chosen) utt.voice = chosen;
    utt.onboundary = (e) => { charIndexRef.current = fromChar + e.charIndex; };
    utt.onend = () => { setTtsPaused(false); setTtsSpeaking(false); };
    setTtsSpeaking(true);
    window.speechSynthesis?.speak(utt);
  }

  useEffect(() => {
    if (!currentTurn?.question) return;
    charIndexRef.current = 0;
    currentQuestionRef.current = currentTurn.question;
    setTtsPaused(false);
    setTtsSpeaking(false);
    speakFrom(currentTurn.question, 0);
  }, [currentTurn?.id, selectedVoiceName]);

  function toggleVoice() {
    if (isListening) { recognitionRef.current?.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setAnswer((prev) => (prev ? prev + " " + transcript : transcript).trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  async function loadSessions() {
    setLoading(true); setErr("");
    try {
      const list = await api("/api/interviews/sessions");
      setSessions(Array.isArray(list) ? list : []);
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally { setLoading(false); }
  }

  async function loadRoles() {
    try {
      const list = await api("/api/roles");
      setRoles(Array.isArray(list) ? list : []);
    } catch (e) { console.error("Failed to load roles:", e); }
  }

  async function startNewInterview() {
    if (!selectedRole) { setErr("Please select a role"); return; }
    setSubmitting(true); setErr("");
    try {
      const result = await api("/api/interviews/sessions", {
        method: "POST",
        body: JSON.stringify({ role_id: Number(selectedRole), mode: selectedMode, total_questions: totalQuestions }),
      });
      setActiveSession(result.session);
      setCurrentTurn(result.first_turn);
      setAllTurns([result.first_turn]);
      setShowNewForm(false);
      setAnswer("");
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally { setSubmitting(false); }
  }

  async function submitAnswer() {
    if (!answer.trim()) { setErr("Please provide an answer"); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    window.speechSynthesis?.cancel();
    setSubmitting(true); setErr("");
    try {
      const result = await api(`/api/interviews/sessions/${activeSession.id}/answer`, {
        method: "POST",
        body: JSON.stringify({ answer: answer.trim() }),
      });
      const updatedTurn = {
        ...currentTurn,
        user_answer: answer.trim(),
        ai_rating: result.evaluation.rating,
        ai_feedback: result.evaluation.feedback,
      };
      const updatedTurns = allTurns.map((t) => t.id === currentTurn.id ? updatedTurn : t);
      if (result.next_turn) {
        setCurrentTurn(updatedTurn);
        setPendingNextTurn(result.next_turn);
        setAllTurns([...updatedTurns, result.next_turn]);
      } else {
        setAllTurns(updatedTurns);
        setCurrentTurn({ ...updatedTurn, _justCompleted: true });
        loadSessions();
      }
      setAnswer("");
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally { setSubmitting(false); }
  }

  async function viewSession(sessionId) {
    setLoading(true); setErr("");
    try {
      const data = await api(`/api/interviews/sessions/${sessionId}`);
      setReviewSession(data.session);
      setAllTurns(data.turns || []);
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally { setLoading(false); }
  }

  async function deleteSession(sessionId) {
    if (!confirm("Delete this interview session?")) return;
    setErr("");
    try {
      await api(`/api/interviews/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (reviewSession?.id === sessionId) { setReviewSession(null); setAllTurns([]); }
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    }
  }

  function backToList() {
    setActiveSession(null); setCurrentTurn(null);
    setAllTurns([]); setReviewSession(null);
    loadSessions();
  }



  if (activeSession && currentTurn) {
    const isCompleted = currentTurn._justCompleted || !currentTurn.question;
    const answeredTurns = allTurns.filter((t) => t.user_answer);
    const currentQuestionNum = activeSession.current_question_number;

    if (isCompleted) {
      const avgScore = answeredTurns.reduce((sum, t) => sum + (t.ai_rating || 0), 0) / answeredTurns.length;
      const strongTurns = answeredTurns.filter((t) => t.ai_rating >= 4.0);
      const weakTurns = answeredTurns.filter((t) => t.ai_rating < 3.5);

      return (
        <Box className="page-content">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
            <EmojiEvents sx={{ fontSize: 32, color: "#f59e0b" }} />
            <Typography variant="h4">Interview Complete!</Typography>
          </Box>

          <Paper sx={{ p: 3.5, mb: 3 }}>
            <Typography sx={{ ...sectionLabel }}>Overall Score</Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 2 }}>
              <Typography sx={{
                fontSize: 52, fontWeight: 800, lineHeight: 1,
                background: "linear-gradient(135deg, #f59e0b, #fb7185)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {avgScore.toFixed(1)}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 22, fontWeight: 600 }}>/5.0</Typography>
              <Chip label={getRatingLabel(avgScore)} sx={{ ...getRatingChipSx(avgScore), ml: 0.5 }} />
            </Box>
            <LinearProgress variant="determinate" value={(avgScore / 5) * 100} sx={{ mb: 3 }} />
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ color: "#86efac", fontWeight: 700, mb: 1.5 }}>✓ Strengths</Typography>
                {strongTurns.length > 0 ? strongTurns.map((t, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "flex-start" }}>
                    <CheckCircle sx={{ fontSize: 14, color: "#86efac", mt: 0.4, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Q{t.turn_number}: {t.ai_feedback?.slice(0, 90)}{t.ai_feedback?.length > 90 && "..."}
                    </Typography>
                  </Box>
                )) : <Typography variant="body2" sx={{ color: "text.secondary" }}>Keep practicing — you'll improve!</Typography>}
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "#fca5a5", fontWeight: 700, mb: 1.5 }}>↑ To Improve</Typography>
                {weakTurns.length > 0 ? weakTurns.map((t, i) => (
                  <Typography key={i} variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                    Q{t.turn_number}: {t.ai_feedback?.slice(0, 90)}{t.ai_feedback?.length > 90 && "..."}
                  </Typography>
                )) : <Typography variant="body2" sx={{ color: "text.secondary" }}>All answers were strong!</Typography>}
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2, mt: 3.5 }}>
              <Button variant="contained" onClick={backToList}>Back to Interviews</Button>
              <Button variant="outlined" color="secondary" onClick={() => setShowNewForm(true)}>Start Another</Button>
            </Box>
          </Paper>

          <Typography sx={{ ...sectionLabel, mt: 1 }}>Full Transcript</Typography>
          {allTurns.map((turn) => (
            <Paper key={turn.id} sx={{ p: 3, mb: 2 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 650 }}>Question {turn.turn_number}</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5, mb: 2 }}>{turn.question}</Typography>
              {turn.user_answer && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 650 }}>Your Answer</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, mb: 2 }}>{turn.user_answer}</Typography>
                  <Chip label={`${turn.ai_rating}/5.0 — ${getRatingLabel(turn.ai_rating)}`} sx={{ ...getRatingChipSx(turn.ai_rating), mb: 1.5 }} />
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{turn.ai_feedback}</Typography>
                </>
              )}
            </Paper>
          ))}
        </Box>
      );
    }

    const showFeedback = currentTurn.user_answer && currentTurn.ai_feedback;
    const progress = ((currentQuestionNum - 1) / activeSession.total_questions) * 100;

    return (
      <Box className="page-content">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Box>
            <Typography variant="h4">Mock Interview</Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
              <Chip label={activeSession.role_title} size="small" sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "text.primary", border: "1px solid rgba(255,255,255,0.10)" }} />
              <Chip label={activeSession.mode} size="small" sx={modeChipSx[activeSession.mode] || modeChipSx.mixed} />
            </Box>
          </Box>
          <Button variant="outlined" color="secondary" size="small" onClick={backToList}>Exit Interview</Button>
        </Box>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Paper sx={{ p: 2.5, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 650 }}>Question {currentQuestionNum} of {activeSession.total_questions}</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>{Math.round(progress)}% complete</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Paper>

        {!showFeedback ? (
          <Paper sx={{ p: 3.5, mb: 3 }}>
            <Typography sx={{ ...sectionLabel }}>Question</Typography>
            <Typography variant="h6" sx={{ mb: 3, lineHeight: 1.65 }}>{currentTurn.question}</Typography>

            <Box sx={{
              display: "flex", alignItems: "center", gap: 1, mb: 3, px: 2, py: 1.5,
              bgcolor: "rgba(255,255,255,0.025)", borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap",
            }}>
              <Typography variant="caption" sx={{ color: "text.secondary", mr: 0.5 }}>Read aloud</Typography>
              {!ttsSpeaking && !ttsPaused ? (
                <Tooltip title="Play question" arrow>
                  <IconButton size="small" onClick={() => { charIndexRef.current = 0; speakFrom(currentQuestionRef.current, 0); }}>
                    <PlayArrow fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <>
                  <Tooltip title={ttsPaused ? "Resume" : "Pause"} arrow>
                    <IconButton size="small" onClick={() => {
                      if (ttsPaused) { speakFrom(currentQuestionRef.current, Math.max(0, charIndexRef.current - 25)); setTtsPaused(false); }
                      else { window.speechSynthesis?.pause(); setTtsPaused(true); }
                    }}>
                      {ttsPaused ? <PlayArrow fontSize="small" /> : <Pause fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Stop" arrow>
                    <IconButton size="small" onClick={() => { window.speechSynthesis?.cancel(); setTtsPaused(false); setTtsSpeaking(false); }}>
                      <Stop fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              {voices.length > 0 && (
                <>
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  <FormControl size="small" sx={{ minWidth: 190 }}>
                    <Select
                      value={selectedVoiceName}
                      onChange={(e) => setSelectedVoiceName(e.target.value)}
                      displayEmpty
                      sx={{ fontSize: "0.78rem", height: 32, ".MuiSelect-select": { py: 0.5 } }}
                    >
                      <MenuItem value=""><em style={{ color: "rgba(241,240,255,0.38)", fontStyle: "normal" }}>Default voice</em></MenuItem>
                      {voices.map((v) => (
                        <MenuItem key={v.name} value={v.name}>
                          {v.name}
                          <Typography component="span" variant="caption" sx={{ ml: 0.5, color: "text.secondary" }}>({v.lang})</Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography sx={{ ...sectionLabel, mb: 0 }}>Your Answer</Typography>
              {voiceSupported && (
                <Tooltip title={isListening ? "Stop recording" : "Speak your answer"} arrow>
                  <IconButton size="small" onClick={toggleVoice} disabled={submitting} sx={isListening ? {
                    bgcolor: "rgba(239,68,68,0.15) !important", color: "#fca5a5 !important",
                    borderColor: "rgba(239,68,68,0.3) !important", animation: `${pulseAnim} 1.4s ease infinite`,
                  } : {}}>
                    {isListening ? <MicOff fontSize="small" /> : <Mic fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {isListening && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#ef4444", animation: `${pulseAnim} 1s ease infinite`, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: "#fca5a5" }}>Listening... speak your answer, then click the mic to stop.</Typography>
              </Box>
            )}

            <TextField
              multiline rows={8} fullWidth value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here, or use the mic button to speak... (2–3 paragraphs recommended)"
              disabled={submitting}
            />

            <Button variant="contained" sx={{ mt: 2.5 }} onClick={submitAnswer} disabled={submitting || !answer.trim()}
              startIcon={submitting ? <CircularProgress size={15} sx={{ color: "rgba(255,255,255,0.65)" }} /> : null}>
              {submitting ? "Submitting..." : "Submit Answer"}
            </Button>
          </Paper>
        ) : (
          <Paper sx={{ p: 3.5, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
              <CheckCircle sx={{ color: "#86efac", fontSize: 20 }} />
              <Typography variant="h6">Answer Submitted</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>Rating</Typography>
              <Chip label={`${currentTurn.ai_rating}/5.0 — ${getRatingLabel(currentTurn.ai_rating)}`} sx={getRatingChipSx(currentTurn.ai_rating)} />
            </Box>
            <Paper sx={{ p: 2, mb: 3, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", "&:hover": { transform: "none" } }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 650 }}>Feedback</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>{currentTurn.ai_feedback}</Typography>
            </Paper>
            <Button variant="contained" onClick={() => {
              setCurrentTurn(pendingNextTurn);
              setActiveSession((prev) => ({ ...prev, current_question_number: pendingNextTurn.turn_number }));
              setPendingNextTurn(null);
            }}>
              Next Question →
            </Button>
          </Paper>
        )}

        {allTurns.filter((t) => t.user_answer && t.id !== currentTurn.id).length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography sx={{ ...sectionLabel }}>Previous Questions</Typography>
            {allTurns.filter((t) => t.user_answer && t.id !== currentTurn.id).map((turn) => (
              <Paper key={turn.id} sx={{ p: 2.5, mb: 2, opacity: 0.72 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 650 }}>Q{turn.turn_number}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, mb: 1.5 }}>{turn.question}</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
                  {turn.user_answer.slice(0, 150)}{turn.user_answer.length > 150 && "..."}
                </Typography>
                <Chip label={`${turn.ai_rating}/5.0`} sx={getRatingChipSx(turn.ai_rating)} size="small" />
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    );
  }



  if (reviewSession) {
    return (
      <Box className="page-content">
        <Button variant="outlined" color="secondary" size="small" onClick={backToList} sx={{ mb: 3 }}>← Back to List</Button>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 1.5 }}>Interview Review</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Chip label={reviewSession.role_title} size="small" sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "text.primary", border: "1px solid rgba(255,255,255,0.10)" }} />
            <Chip label={reviewSession.mode} size="small" sx={modeChipSx[reviewSession.mode] || modeChipSx.mixed} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{fmt(reviewSession.created_at)}</Typography>
          </Box>
        </Box>

        {reviewSession.status === "completed" && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography sx={{ ...sectionLabel }}>Overall Score</Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mt: 0.5 }}>
              <Typography sx={{
                fontSize: 44, fontWeight: 800, lineHeight: 1,
                background: "linear-gradient(135deg, #f59e0b, #fb7185)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {Number(reviewSession.average_score)?.toFixed(1) || "N/A"}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontWeight: 600 }}>/5.0</Typography>
              <Chip label={getRatingLabel(reviewSession.average_score)} sx={getRatingChipSx(reviewSession.average_score)} />
            </Box>
          </Paper>
        )}

        <Typography sx={{ ...sectionLabel }}>Full Transcript</Typography>
        {allTurns.map((turn) => (
          <Paper key={turn.id} sx={{ p: 3, mb: 2 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 650 }}>Question {turn.turn_number}</Typography>
            <Typography sx={{ fontWeight: 600, mt: 0.5, mb: 2 }}>{turn.question}</Typography>
            {turn.user_answer ? (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 650 }}>Your Answer</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, mb: 2 }}>{turn.user_answer}</Typography>
                <Chip label={`${turn.ai_rating}/5.0 — ${getRatingLabel(turn.ai_rating)}`} sx={{ ...getRatingChipSx(turn.ai_rating), mb: 1.5 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>{turn.ai_feedback}</Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>Not answered yet</Typography>
            )}
          </Paper>
        ))}
      </Box>
    );
  }



  if (showNewForm) {
    return (
      <Box className="page-content">
        <Button variant="outlined" color="secondary" size="small" onClick={() => setShowNewForm(false)} sx={{ mb: 3 }}>← Cancel</Button>
        <Typography variant="h4" sx={{ mb: 3 }}>Start New Interview</Typography>
        {err && <Alert severity="error" sx={{ mb: 3 }}>{err}</Alert>}
        <Paper sx={{ p: 3.5 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Target Role *</InputLabel>
            <Select value={selectedRole} label="Target Role *" onChange={(e) => setSelectedRole(e.target.value)}>
              <MenuItem value=""><em style={{ color: "rgba(241,240,255,0.38)", fontStyle: "normal" }}>Select a role</em></MenuItem>
              {roles.map((role) => <MenuItem key={role.id} value={role.id}>{role.title}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ ...sectionLabel }}>Interview Type *</Typography>
            <RadioGroup value={selectedMode} onChange={(e) => setSelectedMode(e.target.value)}>
              {[
                { value: "technical", label: "Technical", sub: "Coding, system design, technical knowledge" },
                { value: "behavioral", label: "Behavioral", sub: "STAR method, soft skills, past experiences" },
                { value: "mixed", label: "Mixed", sub: "Combination of technical and behavioral" },
              ].map(({ value, label, sub }) => (
                <Paper key={value} onClick={() => setSelectedMode(value)} sx={{
                  p: 1.5, mb: 1, cursor: "pointer",
                  border: selectedMode === value ? "1px solid rgba(245,158,11,0.45)" : "1px solid rgba(255,255,255,0.07)",
                  bgcolor: selectedMode === value ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.015)",
                  "&:hover": { transform: "none", border: selectedMode === value ? "1px solid rgba(245,158,11,0.55)" : "1px solid rgba(255,255,255,0.14)" },
                }}>
                  <FormControlLabel value={value} control={<Radio size="small" />}
                    label={<Box><Typography variant="body2" sx={{ fontWeight: 650 }}>{label}</Typography><Typography variant="caption" sx={{ color: "text.secondary" }}>{sub}</Typography></Box>}
                    sx={{ m: 0, width: "100%" }} />
                </Paper>
              ))}
            </RadioGroup>
          </Box>

          <FormControl fullWidth sx={{ mb: 3.5 }}>
            <InputLabel>Number of Questions</InputLabel>
            <Select value={totalQuestions} label="Number of Questions" onChange={(e) => setTotalQuestions(Number(e.target.value))}>
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => <MenuItem key={n} value={n}>{n} questions</MenuItem>)}
            </Select>
          </FormControl>

          <Button variant="contained" onClick={startNewInterview} disabled={submitting || !selectedRole}
            startIcon={submitting ? <CircularProgress size={15} sx={{ color: "rgba(255,255,255,0.65)" }} /> : null}>
            {submitting ? "Starting..." : "Start Interview"}
          </Button>
        </Paper>
      </Box>
    );
  }



  return (
    <Box className="page-content">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4">Mock Interviews</Typography>
        <Button variant="contained" onClick={() => setShowNewForm(true)}>Start New Interview</Button>
      </Box>

      {err && <Alert severity="error" sx={{ mb: 3 }}>{err}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>
      ) : sessions.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography sx={{ fontSize: 52, mb: 2 }}>🎤</Typography>
          <Typography variant="h5" sx={{ mb: 1 }}>No interviews yet</Typography>
          <Typography sx={{ color: "text.secondary", mb: 3 }}>Start your first mock interview to practice for real applications.</Typography>
          <Button variant="contained" onClick={() => setShowNewForm(true)}>Start Interview</Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {sessions.map((session) => (
            <Paper key={session.id} sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>{session.role_title}</Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 1 }}>
                    <Chip label={session.mode} size="small" sx={modeChipSx[session.mode] || modeChipSx.mixed} />
                    {session.status === "completed" ? (
                      <>
                        <Chip label={`${Number(session.average_score)?.toFixed(1) || "N/A"}/5.0`} size="small" sx={getRatingChipSx(session.average_score)} />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <CheckCircle sx={{ fontSize: 13, color: "#86efac" }} />
                          <Typography variant="caption" sx={{ color: "#86efac" }}>Completed</Typography>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <AccessTime sx={{ fontSize: 13, color: "#fcd34d" }} />
                        <Typography variant="caption" sx={{ color: "#fcd34d" }}>In Progress ({session.current_question_number}/{session.total_questions})</Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>{fmt(session.created_at)}</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, ml: 2, flexShrink: 0 }}>
                  <Tooltip title="View session" arrow>
                    <IconButton size="small" onClick={() => viewSession(session.id)}><Visibility fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete session" arrow>
                    <IconButton size="small" onClick={() => deleteSession(session.id)} sx={{
                      "&:hover": { bgcolor: "rgba(239,68,68,0.12) !important", color: "#fca5a5 !important", borderColor: "rgba(239,68,68,0.25) !important" },
                    }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}