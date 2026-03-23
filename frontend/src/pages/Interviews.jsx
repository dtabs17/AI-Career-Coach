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
  Visibility, CheckCircle, AccessTime, EmojiEvents, Badge,
} from "@mui/icons-material";
import { useToast } from "../toast/ToastContext";
import ConfirmDialog from "../components/ConfirmDialog";


const pulseAnim = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
`;

const barAnim = keyframes`
  0%, 100% { transform: scaleY(0.30); }
  50%       { transform: scaleY(1.0); }
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
  if (rating >= 4.5) return { bgcolor: "rgba(34,197,94,0.12)", color: "#86efac", border: "1px solid rgba(34,197,94,0.22)" };
  if (rating >= 2.5) return { bgcolor: "rgba(245,158,11,0.12)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.22)" };
  return { bgcolor: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.22)" };
}

const modeChipSx = {
  bgcolor: "rgba(255,255,255,0.06)",
  color: "rgba(241,240,255,0.65)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const sectionLabel = {
  color: "text.secondary",
  fontWeight: 650,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontSize: "0.70rem",
  mb: 1,
};

/**
 * Displays a lightweight speaking indicator while question audio is playing.
 */
function Waveform({ active }) {
  const bars = [55, 100, 68, 90, 48, 82, 60, 95, 62];
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "2.5px", height: 16, flexShrink: 0 }}>
      {bars.map((h, i) => (
        <Box
          key={i}
          sx={{
            width: 3,
            height: `${h}%`,
            borderRadius: 999,
            bgcolor: active ? "#f59e0b" : "rgba(245,158,11,0.18)",
            transformOrigin: "center",
            transition: "background-color 350ms ease",
            animation: active
              ? `${barAnim} ${0.58 + i * 0.07}s ease-in-out infinite`
              : "none",
            animationDelay: active ? `${i * 0.06}s` : "0s",
          }}
        />
      ))}
    </Box>
  );
}


export default function Interviews() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [roles, setRoles] = useState([]);

  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedMode, setSelectedMode] = useState("mixed");
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [suggestedRole, setSuggestedRole] = useState(null);

  const [activeSession, setActiveSession] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [pendingNextTurn, setPendingNextTurn] = useState(null);
  const [answer, setAnswer] = useState("");
  const [allTurns, setAllTurns] = useState([]);
  const [reviewSession, setReviewSession] = useState(null);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const [ttsPaused, setTtsPaused] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, sessionId: null });


  useEffect(() => {
    loadSessions();
    loadRoles();
    // Fetch the user's last recommendation run to pre-select the top suggested
    // role in the new interview form. Failures are silently ignored since this
    // is a convenience feature, not critical to the page.
    (async () => {
      try {
        const runs = await api("/api/recommendations/runs");
        if (Array.isArray(runs) && runs.length > 0) {
          const lastRun = runs[0];
          const detail = await api(`/api/recommendations/runs/${lastRun.id}`);
          const items = detail?.items;
          if (Array.isArray(items) && items.length > 0) {
            setSuggestedRole({ id: items[0].role_id, title: items[0].title });
          }
        }
      } catch {
        //
      }
    })();
  }, []);

  // Detect browser speech-recognition support once and clean up any active
  // microphone or audio resources when the page unmounts.
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setVoiceSupported(true);
    return () => {
      recognitionRef.current?.abort();
      stopTts();
    };
  }, []);

  // Auto-play the question audio each time a new turn loads. The 700ms delay
  // gives React time to commit the new turn to the DOM and the browser time to
  // settle before the audio fetch starts, preventing a flash of unstyled content
  // mid-playback on slower connections.
  useEffect(() => {
    if (!currentTurn?.question) return;
    const timer = setTimeout(() => { speakQuestion(currentTurn.question); }, 700);
    return () => clearTimeout(timer);
  }, [currentTurn?.id]);


  function stopTts() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setTtsSpeaking(false);
    setTtsPaused(false);
  }

  function pauseTts() {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setTtsSpeaking(false);
      setTtsPaused(true);
    }
  }

  function resumeTts() {
    if (audioRef.current && audioRef.current.paused) {
      // Rewind by 1.2 seconds before resuming. Audio paused mid-sentence sounds
      // abrupt on resume, so a short rewind provides natural overlap.
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 1.2);
      audioRef.current.play();
      setTtsPaused(false);
      setTtsSpeaking(true);
    }
  }

  async function speakQuestion(text) {
    stopTts();
    setTtsLoading(true);
    try {
      // voice_id is included in the request body for API consistency but the
      // backend ignores it and uses the hardcoded INTERVIEW_VOICE_ID constant.
      const res = await fetch("/api/interviews/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text, voice_id: "cjVigY5qzO86Huf0OWal" }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => { setTtsSpeaking(true); setTtsPaused(false); };
      audio.onpause = () => { if (!audio.ended) { setTtsSpeaking(false); setTtsPaused(true); } };
      audio.onended = () => { setTtsSpeaking(false); setTtsPaused(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setTtsSpeaking(false); setTtsPaused(false); };
      audio.play();
    } catch {
      // setTtsLoading is handled in finally; nothing else to do on fetch failure.
    } finally {
      setTtsLoading(false);
    }
  }


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

  // Session creation returns both the persisted session record and the first
  // generated question so the page can enter the live interview state at once.
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
      showToast("Interview started. Good luck!");
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally { setSubmitting(false); }
  }

  // The answer endpoint evaluates the current turn and, unless the interview
  // is complete, also returns the next generated question in the same request.
  async function submitAnswer() {
    if (!answer.trim()) { setErr("Please provide an answer"); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    stopTts();
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
        // _justCompleted is a synthetic client-side flag, not a database field.
        // It signals the active interview view to render the completion screen
        // instead of waiting for a next turn that will never arrive.
        setCurrentTurn({ ...updatedTurn, _justCompleted: true });
        loadSessions();
      }
      setAnswer("");
      showToast("Answer submitted.");
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally { setSubmitting(false); }
  }

  async function viewSession(sessionId) {
    setLoading(true); setErr("");
    try {
      const data = await api(`/api/interviews/sessions/${sessionId}`);
      const session = data.session;
      const turns = data.turns || [];

      // Rebuild whichever state the user left last: resume the current live
      // question for in-progress sessions, or show the completed transcript.
      if (session.status === "in_progress") {
        const answeredTurns = turns.filter((t) => t.user_answer);
        const currentTurn = turns.find((t) => t.turn_number === session.current_question_number);
        setActiveSession({ ...session, role_title: session.role_title });
        setAllTurns(answeredTurns);
        setCurrentTurn(currentTurn || null);
        setPendingNextTurn(null);
        setAnswer("");
      } else {
        setReviewSession(session);
        setAllTurns(turns);
      }
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally { setLoading(false); }
  }

  function confirmDelete(sessionId) {
    setConfirmDialog({ open: true, sessionId });
  }

  async function deleteSession(sessionId) {
    setConfirmDialog({ open: false, sessionId: null });
    setErr("");
    try {
      await api(`/api/interviews/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (reviewSession?.id === sessionId) { setReviewSession(null); setAllTurns([]); }
      showToast("Session deleted.", "info");
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    }
  }

  function backToList() {
    setActiveSession(null);
    setCurrentTurn(null);
    setAllTurns([]);
    setReviewSession(null);
    loadSessions();
  }


  // Keep the live interview experience separate from the setup/list view so
  // microphone, audio, and completion state stay scoped to the active session.
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
            <Typography variant="h4">Interview complete</Typography>
          </Box>

          <Paper sx={{ p: 3.5, mb: 3 }}>
            <Typography sx={{ ...sectionLabel }}>Overall score</Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 2 }}>
              <Typography sx={{ fontSize: 52, fontWeight: 800, lineHeight: 1, color: "#f59e0b" }}>
                {avgScore.toFixed(1)}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 22, fontWeight: 600 }}>/5.0</Typography>
              <Chip label={getRatingLabel(avgScore)} sx={{ ...getRatingChipSx(avgScore), ml: 0.5 }} />
            </Box>
            <LinearProgress variant="determinate" value={(avgScore / 5) * 100} sx={{ mb: 3 }} />
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ color: "#86efac", fontWeight: 700, mb: 1.5 }}>Strengths</Typography>
                {strongTurns.length > 0 ? strongTurns.map((t, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "flex-start" }}>
                    <CheckCircle sx={{ fontSize: 14, color: "#86efac", mt: 0.4, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Q{t.turn_number}: {t.ai_feedback?.slice(0, 90)}{t.ai_feedback?.length > 90 && "..."}
                    </Typography>
                  </Box>
                )) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>Keep practising. You will get there.</Typography>
                )}
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "#fca5a5", fontWeight: 700, mb: 1.5 }}>To improve</Typography>
                {weakTurns.length > 0 ? weakTurns.map((t, i) => (
                  <Typography key={i} variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                    Q{t.turn_number}: {t.ai_feedback?.slice(0, 90)}{t.ai_feedback?.length > 90 && "..."}
                  </Typography>
                )) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>All answers were strong.</Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 3.5, flexWrap: "wrap" }}>
              <Button variant="contained" onClick={backToList}>Back to interviews</Button>
              <Button variant="outlined" color="secondary" onClick={() => setShowNewForm(true)}>Start another</Button>
            </Box>
          </Paper>

          <Typography sx={{ ...sectionLabel, mt: 1 }}>Full transcript</Typography>
          {allTurns.map((turn) => (
            <Paper key={turn.id} sx={{ p: 3, mb: 2 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 650 }}>Question {turn.turn_number}</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5, mb: 2 }}>{turn.question}</Typography>
              {turn.user_answer && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 650 }}>Your answer</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, mb: 2 }}>{turn.user_answer}</Typography>
                  <Chip label={`${turn.ai_rating}/5.0 (${getRatingLabel(turn.ai_rating)})`} sx={{ ...getRatingChipSx(turn.ai_rating), mb: 1.5 }} />
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{turn.ai_feedback}</Typography>
                </>
              )}
            </Paper>
          ))}
        </Box>
      );
    }

    // Once the backend scores the submitted answer, the current-turn panel
    // temporarily switches into feedback mode until the user advances.
    const showFeedback = currentTurn.user_answer && currentTurn.ai_feedback;

    return (
      <Box className="page-content">

        <Paper sx={{ p: 0, overflow: "hidden" }}>

          <Box sx={{
            px: { xs: 2, sm: 2.5 },
            pt: { xs: 1.5, sm: 1.75 },
            pb: 0,
            bgcolor: "rgba(11,10,16,0.97)",
          }}>
            <Box sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.25,
            }}>
              <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", flex: 1, minWidth: 0, overflow: "hidden" }}>
                <Chip
                  label={activeSession.role_title}
                  size="small"
                  sx={{
                    ...modeChipSx,
                    maxWidth: { xs: 110, sm: 200, md: "none" },
                    "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                  }}
                />
                <Chip label={activeSession.mode} size="small" sx={modeChipSx} />
              </Box>

              {/* Centre: Q counter uses a flex trick to stay centred without absolute positioning */}
              <Typography sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "rgba(241,240,255,0.30)",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                flexShrink: 0,
                mx: { xs: 1, sm: 2 },
              }}>
                Q {currentQuestionNum} / {activeSession.total_questions}
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "flex-end", flex: 1 }}>
                <Button variant="outlined" color="secondary" size="small" onClick={backToList}>
                  Exit
                </Button>
              </Box>
            </Box>

            {/* Full-width progress bar flush to the bottom of the topbar */}
            <LinearProgress
              variant="determinate"
              value={((currentQuestionNum - 1) / activeSession.total_questions) * 100}
              sx={{
                height: 2,
                borderRadius: 0,
                bgcolor: "rgba(255,255,255,0.05)",
                "& .MuiLinearProgress-bar": {
                  background: "linear-gradient(90deg, #f59e0b, #fb923c)",
                  borderRadius: 0,
                },
              }}
            />
          </Box>

          {err && (
            <Alert severity="error" sx={{ mx: { xs: 2, sm: 2.5 }, mt: 1.5 }}>{err}</Alert>
          )}

          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            minHeight: { md: 430 },
          }}>

            <Box sx={{
              p: { xs: "20px 20px 22px", sm: "26px 28px 24px" },
              bgcolor: "rgba(14,13,22,0.98)",
              borderRight: { md: "1px solid rgba(255,255,255,0.06)" },
              borderBottom: { xs: "1px solid rgba(255,255,255,0.07)", md: "none" },
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}>

              <Box sx={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: 2,
                background: "linear-gradient(90deg, #f59e0b 0%, rgba(251,146,60,0.55) 55%, transparent 100%)",
                opacity: ttsSpeaking ? 1 : 0.28,
                transition: "opacity 400ms ease",
              }} />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: { xs: 2, md: 2.5 } }}>
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(245,158,11,0.90), rgba(251,146,60,0.80))",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  boxShadow: ttsSpeaking
                    ? "0 0 0 3px rgba(245,158,11,0.18), 0 4px 16px rgba(245,158,11,0.22)"
                    : "0 2px 10px rgba(0,0,0,0.40)",
                  transition: "box-shadow 400ms ease",
                }}>
                  <Badge sx={{ fontSize: 18, color: "#1a1a1a" }} />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(241,240,255,0.80)", lineHeight: 1.2 }}>
                    AI Interviewer
                  </Typography>
                  <Typography sx={{
                    fontSize: "0.695rem",
                    fontWeight: 600,
                    mt: 0.3,
                    color: ttsSpeaking
                      ? "#f59e0b"
                      : ttsPaused
                        ? "rgba(245,158,11,0.50)"
                        : "rgba(241,240,255,0.30)",
                    transition: "color 350ms ease",
                  }}>
                    {ttsSpeaking ? "Speaking..." : ttsPaused ? "Paused" : "Ready"}
                  </Typography>
                </Box>

                <Waveform active={ttsSpeaking} />
              </Box>

              <Typography sx={{ ...sectionLabel, mb: { xs: 1, md: 1.25 } }}>Question</Typography>

              {/* Question text grows to fill available vertical space on desktop */}
              <Typography sx={{
                fontSize: { xs: "0.975rem", sm: "1.05rem" },
                fontWeight: 520,
                lineHeight: 1.85,
                color: "#f1f0ff",
                letterSpacing: "-0.01em",
                flex: 1,
              }}>
                {currentTurn.question}
              </Typography>

              {/* Feedback state only: show the user's submitted answer on the left
                  so they can read question and their answer together while reviewing feedback */}
              {showFeedback && currentTurn.user_answer && (
                <Box sx={{
                  mt: { xs: 2, md: 2.5 },
                  p: { xs: "12px 14px", sm: "14px 16px" },
                  borderRadius: "8px",
                  bgcolor: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <Typography sx={{ ...sectionLabel, mb: 0.75 }}>Your answer</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(241,240,255,0.45)", lineHeight: 1.65 }}>
                    {currentTurn.user_answer.slice(0, 180)}
                    {currentTurn.user_answer.length > 180 && "..."}
                  </Typography>
                </Box>
              )}

              {!showFeedback && (
                <Box sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: { xs: 2, md: 2.5 },
                  pt: { xs: 1.75, md: 2 },
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}>
                  {ttsLoading ? (
                    <CircularProgress size={13} sx={{ color: "rgba(241,240,255,0.28)", mx: 0.75 }} />
                  ) : (
                    <>
                      {!ttsSpeaking && !ttsPaused && (
                        <Tooltip title="Replay question" arrow>
                          <IconButton
                            size="small"
                            onClick={() => speakQuestion(currentTurn.question)}
                            sx={{ color: "rgba(241,240,255,0.32)", "&:hover": { color: "rgba(241,240,255,0.80)" } }}
                          >
                            <PlayArrow sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {ttsSpeaking && (
                        <>
                          <Tooltip title="Pause" arrow>
                            <IconButton size="small" onClick={pauseTts}>
                              <Pause sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Stop" arrow>
                            <IconButton size="small" onClick={stopTts}>
                              <Stop sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {ttsPaused && (
                        <>
                          <Tooltip title="Resume (rewinds ~1s)" arrow>
                            <IconButton size="small" onClick={resumeTts} sx={{ color: "#f59e0b", "&:hover": { color: "#fbbf24" } }}>
                              <PlayArrow sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Stop" arrow>
                            <IconButton size="small" onClick={stopTts}>
                              <Stop sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </>
                  )}
                  <Typography variant="caption" sx={{ color: "rgba(241,240,255,0.18)", ml: 0.5 }}>
                    {ttsSpeaking ? "Playing audio" : ttsPaused ? "Audio paused" : "Replay question audio"}
                  </Typography>
                </Box>
              )}
            </Box>


            {!showFeedback ? (
              <Box sx={{
                p: { xs: "20px 20px 22px", sm: "26px 28px 24px" },
                bgcolor: "#0c0b0f",
                display: "flex",
                flexDirection: "column",
              }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 2, md: 2.5 } }}>
                  <Typography sx={{ ...sectionLabel, mb: 0 }}>
                    {isListening ? "Transcript" : "Your response"}
                  </Typography>
                  {answer && (
                    <Typography variant="caption" sx={{ color: "rgba(241,240,255,0.22)" }}>
                      {answer.trim().split(/\s+/).length} words
                    </Typography>
                  )}
                </Box>

                {voiceSupported && (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: { xs: 2, md: 2.5 } }}>
                    <Box
                      onClick={() => !submitting && toggleVoice()}
                      sx={{
                        width: { xs: 58, md: 64 },
                        height: { xs: 58, md: 64 },
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        cursor: submitting ? "default" : "pointer",
                        bgcolor: isListening ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.08)",
                        border: isListening
                          ? "2px solid rgba(239,68,68,0.48)"
                          : "2px solid rgba(245,158,11,0.28)",
                        boxShadow: isListening ? "0 0 0 8px rgba(239,68,68,0.07)" : "none",
                        transition: "all 200ms ease",
                        animation: isListening ? `${pulseAnim} 1.4s ease infinite` : "none",
                        "&:hover": submitting ? {} : {
                          bgcolor: isListening ? "rgba(239,68,68,0.20)" : "rgba(245,158,11,0.14)",
                          boxShadow: isListening
                            ? "0 0 0 12px rgba(239,68,68,0.05)"
                            : "0 0 0 12px rgba(245,158,11,0.05)",
                        },
                      }}
                    >
                      {isListening
                        ? <MicOff sx={{ fontSize: { xs: 24, md: 26 }, color: "#fca5a5" }} />
                        : <Mic sx={{ fontSize: { xs: 24, md: 26 }, color: "#f59e0b" }} />
                      }
                    </Box>
                    <Typography variant="caption" sx={{
                      mt: 1,
                      color: isListening ? "#fca5a5" : "rgba(241,240,255,0.30)",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                    }}>
                      {isListening ? "Listening, tap to stop" : "Tap to speak"}
                    </Typography>
                  </Box>
                )}

                <TextField
                  multiline
                  rows={voiceSupported ? 5 : 8}
                  fullWidth
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={
                    voiceSupported
                      ? "Your spoken answer will appear here. You can also type directly."
                      : "Type your answer here..."
                  }
                  disabled={submitting}
                  sx={{
                    flex: 1,
                    mb: 2,
                    "& .MuiInputBase-root": { fontSize: "0.9rem", lineHeight: 1.7 },
                  }}
                />

                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={submitAnswer}
                    disabled={submitting || !answer.trim()}
                    startIcon={submitting ? <CircularProgress size={16} sx={{ color: "rgba(0,0,0,0.50)" }} /> : null}
                    sx={{ px: 5, py: 1.25 }}
                  >
                    {submitting ? "Submitting..." : "Submit answer"}
                  </Button>
                </Box>
              </Box>

            ) : (

              <Box sx={{
                p: { xs: "20px 20px 22px", sm: "26px 28px 24px" },
                bgcolor: "#0c0b0f",
                display: "flex",
                flexDirection: "column",
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5, flexWrap: "wrap" }}>
                  <CheckCircle sx={{ color: "#86efac", fontSize: 19 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }}>Answer received</Typography>
                  <Chip
                    label={`${currentTurn.ai_rating}/5.0. ${getRatingLabel(currentTurn.ai_rating)}`}
                    sx={{ ...getRatingChipSx(currentTurn.ai_rating), ml: { xs: 0, sm: "auto" } }}
                  />
                </Box>

                <Typography variant="body2" sx={{
                  color: "rgba(241,240,255,0.55)",
                  lineHeight: 1.85,
                  flex: 1,
                }}>
                  {currentTurn.ai_feedback}
                </Typography>

                <Box sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: { xs: 2.5, md: 3 },
                  pt: { xs: 2, md: 2.5 },
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{ px: 5 }}
                    onClick={() => {
                      setCurrentTurn(pendingNextTurn);
                      setActiveSession((prev) => ({ ...prev, current_question_number: pendingNextTurn.turn_number }));
                      setPendingNextTurn(null);
                    }}
                  >
                    Next question
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {allTurns.filter((t) => t.user_answer && t.id !== currentTurn.id).length > 0 && (
          <Box sx={{ mt: 5, pt: 3.5, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <Typography sx={{ ...sectionLabel, mb: 2 }}>Previous answers</Typography>
            {allTurns.filter((t) => t.user_answer && t.id !== currentTurn.id).map((turn) => (
              <Box key={turn.id} sx={{
                py: 2,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
                opacity: 0.55,
              }}>
                <Typography variant="caption" sx={{ color: "rgba(241,240,255,0.30)", fontWeight: 700, minWidth: 24, mt: 0.25 }}>
                  Q{turn.turn_number}
                </Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: "rgba(241,240,255,0.70)" }}>
                    {turn.question}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(241,240,255,0.38)" }}>
                    {turn.user_answer.slice(0, 120)}{turn.user_answer.length > 120 && "..."}
                  </Typography>
                </Box>
                <Chip
                  label={`${turn.ai_rating}/5`}
                  sx={{ ...getRatingChipSx(turn.ai_rating), flexShrink: 0, height: 22, fontSize: "0.68rem" }}
                  size="small"
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  }


  if (reviewSession) {
    return (
      <Box className="page-content">
        <Button variant="outlined" color="secondary" size="small" onClick={backToList} sx={{ mb: 3 }}>
          Back to list
        </Button>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 1.5 }}>Interview review</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Chip label={reviewSession.role_title} size="small" sx={modeChipSx} />
            <Chip label={reviewSession.mode} size="small" sx={modeChipSx} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{fmt(reviewSession.created_at)}</Typography>
          </Box>
        </Box>

        {reviewSession.status === "completed" && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography sx={{ ...sectionLabel }}>Overall score</Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mt: 0.5 }}>
              <Typography sx={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: "#f59e0b" }}>
                {Number(reviewSession.average_score)?.toFixed(1) || "N/A"}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontWeight: 600 }}>/5.0</Typography>
              <Chip label={getRatingLabel(reviewSession.average_score)} sx={getRatingChipSx(reviewSession.average_score)} />
            </Box>
          </Paper>
        )}

        <Typography sx={{ ...sectionLabel }}>Full transcript</Typography>
        {allTurns.map((turn) => (
          <Paper key={turn.id} sx={{ p: 3, mb: 2 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 650 }}>Question {turn.turn_number}</Typography>
            <Typography sx={{ fontWeight: 600, mt: 0.5, mb: 2 }}>{turn.question}</Typography>
            {turn.user_answer ? (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 650 }}>Your answer</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, mb: 2 }}>{turn.user_answer}</Typography>
                <Chip label={`${turn.ai_rating}/5.0 (${getRatingLabel(turn.ai_rating)})`} sx={{ ...getRatingChipSx(turn.ai_rating), mb: 1.5 }} />
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
        <Button variant="outlined" color="secondary" size="small" onClick={() => setShowNewForm(false)} sx={{ mb: 3 }}>
          Cancel
        </Button>
        <Typography variant="h4" sx={{ mb: 3 }}>Start new interview</Typography>
        {err && <Alert severity="error" sx={{ mb: 3 }}>{err}</Alert>}

        <Paper sx={{ p: 3.5 }}>
          {suggestedRole && (
            <Box sx={{ mb: 2.5, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                Your top recommended role:
              </Typography>
              <Chip
                label={suggestedRole.title}
                size="small"
                onClick={() => setSelectedRole(suggestedRole.id)}
                sx={{
                  cursor: "pointer",
                  border: selectedRole === suggestedRole.id
                    ? "1px solid rgba(245,158,11,0.55)"
                    : "1px solid rgba(245,158,11,0.25)",
                  bgcolor: selectedRole === suggestedRole.id
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(245,158,11,0.05)",
                  color: "#f59e0b",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "rgba(245,158,11,0.12)" },
                }}
              />
            </Box>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Target role</InputLabel>
            <Select value={selectedRole} label="Target role" onChange={(e) => setSelectedRole(e.target.value)}>
              <MenuItem value=""><em style={{ color: "rgba(241,240,255,0.38)", fontStyle: "normal" }}>Select a role</em></MenuItem>
              {roles.map((role) => <MenuItem key={role.id} value={role.id}>{role.title}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ ...sectionLabel }}>Interview type</Typography>
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
                  "&:hover": {
                    border: selectedMode === value ? "1px solid rgba(245,158,11,0.55)" : "1px solid rgba(255,255,255,0.14)",
                  },
                }}>
                  <FormControlLabel
                    value={value}
                    control={<Radio size="small" />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 650 }}>{label}</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>{sub}</Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: "100%" }}
                  />
                </Paper>
              ))}
            </RadioGroup>
          </Box>

          <FormControl fullWidth sx={{ mb: 3.5 }}>
            <InputLabel>Number of questions</InputLabel>
            <Select value={totalQuestions} label="Number of questions" onChange={(e) => setTotalQuestions(Number(e.target.value))}>
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => <MenuItem key={n} value={n}>{n} questions</MenuItem>)}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={startNewInterview}
            disabled={submitting || !selectedRole}
            startIcon={submitting ? <CircularProgress size={15} sx={{ color: "rgba(0,0,0,0.50)" }} /> : null}
          >
            {submitting ? "Starting..." : "Start interview"}
          </Button>
        </Paper>
      </Box>
    );
  }


  return (
    <Box className="page-animate page-content">
      <Box sx={{
        pb: 3, mb: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
      }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Mock interviews</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            Practise with AI-generated questions and get instant feedback on every answer.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setShowNewForm(true)}>
          Start new interview
        </Button>
      </Box>
      {/* Amber accent line replacing the plain white header divider */}
      <Box sx={{ height: 2, background: "linear-gradient(90deg, #f59e0b 0%, rgba(251,146,60,0.55) 55%, transparent 100%)", opacity: 0.50, mb: 3 }} />

      {err && <Alert severity="error" sx={{ mb: 3 }}>{err}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : sessions.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography sx={{ fontSize: 44, mb: 2 }}>🎤</Typography>
          <Typography variant="h5" sx={{ mb: 1 }}>No interviews yet</Typography>
          <Typography sx={{ color: "text.secondary", mb: 3 }}>
            Start your first mock interview to practise for real applications.
          </Typography>
          <Button variant="contained" onClick={() => setShowNewForm(true)}>Start interview</Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {sessions.map((session) => {
            const isInProgress = session.status !== "completed";
            const score = Number(session.average_score);

            return (
              <Paper
                key={session.id}
                sx={{ p: 0, overflow: "hidden", display: "flex" }}
              >
                <Box sx={{
                  width: 3,
                  flexShrink: 0,
                  background: isInProgress
                    ? "linear-gradient(180deg, #f59e0b, rgba(245,158,11,0.22))"
                    : "linear-gradient(180deg, #22c55e, rgba(34,197,94,0.22))",
                  borderRadius: "10px 0 0 10px",
                }} />

                <Box sx={{
                  p: { xs: "14px 14px 14px 16px", sm: "16px 18px 16px 20px" },
                  flexGrow: 1,
                  minWidth: 0,
                }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ mb: 1, fontSize: "0.96rem" }}>
                        {session.role_title}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 1 }}>
                        <Chip label={session.mode} size="small" sx={modeChipSx} />

                        {session.status === "completed" ? (
                          <>
                            <Chip
                              label={`${score?.toFixed(1) || "N/A"} / 5.0`}
                              size="small"
                              sx={getRatingChipSx(score)}
                            />
                            <Chip
                              label={getRatingLabel(score)}
                              size="small"
                              sx={{ ...getRatingChipSx(score), opacity: 0.72 }}
                            />
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <CheckCircle sx={{ fontSize: 13, color: "#22c55e" }} />
                              <Typography variant="caption" sx={{ color: "#22c55e" }}>Completed</Typography>
                            </Box>
                          </>
                        ) : (
                          <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
                              <AccessTime sx={{ fontSize: 13, color: "#fcd34d" }} />
                              <Typography variant="caption" sx={{ color: "#fcd34d" }}>
                                In progress ({session.current_question_number}/{session.total_questions})
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={((session.current_question_number - 1) / session.total_questions) * 100}
                              sx={{
                                width: 120,
                                height: 3,
                                borderRadius: 2,
                                bgcolor: "rgba(255,255,255,0.07)",
                                "& .MuiLinearProgress-bar": { bgcolor: "#f59e0b" },
                              }}
                            />
                          </Box>
                        )}
                      </Box>

                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {fmt(session.created_at)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, ml: 1.5, flexShrink: 0 }}>
                      <Tooltip title="View session" arrow>
                        <IconButton size="small" onClick={() => viewSession(session.id)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete session" arrow>
                        <IconButton
                          size="small"
                          onClick={() => confirmDelete(session.id)}
                          sx={{
                            "&:hover": {
                              bgcolor: "rgba(239,68,68,0.12) !important",
                              color: "#fca5a5 !important",
                              borderColor: "rgba(239,68,68,0.25) !important",
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete session"
        message="This interview session and all its answers will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={() => deleteSession(confirmDialog.sessionId)}
        onCancel={() => setConfirmDialog({ open: false, sessionId: null })}
      />
    </Box>
  );
}