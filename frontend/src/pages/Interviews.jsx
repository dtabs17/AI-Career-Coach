import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
import { Spinner, Alert, Button, Form, Badge, Card } from "react-bootstrap";
import { FiPlay, FiTrash2, FiClock, FiCheckCircle } from "react-icons/fi";

function fmt(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function getRatingColor(rating) {
  if (rating >= 4.5) return "success";
  if (rating >= 3.5) return "primary";
  if (rating >= 2.5) return "warning";
  return "danger";
}

function getRatingLabel(rating) {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Very Good";
  if (rating >= 2.5) return "Good";
  if (rating >= 1.5) return "Fair";
  return "Needs Improvement";
}

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

  useEffect(() => {
    loadSessions();
    loadRoles();
  }, []);

  async function loadSessions() {
    setLoading(true);
    setErr("");
    try {
      const list = await api("/api/interviews/sessions");
      setSessions(Array.isArray(list) ? list : []);
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadRoles() {
    try {
      const list = await api("/api/roles");
      setRoles(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Failed to load roles:", e);
    }
  }

  async function startNewInterview() {
    if (!selectedRole) {
      setErr("Please select a role");
      return;
    }

    setSubmitting(true);
    setErr("");
    try {
      const result = await api("/api/interviews/sessions", {
        method: "POST",
        body: JSON.stringify({
          role_id: Number(selectedRole),
          mode: selectedMode,
          total_questions: totalQuestions,
        }),
      });

      setActiveSession(result.session);
      setCurrentTurn(result.first_turn);
      setAllTurns([result.first_turn]);
      setShowNewForm(false);
      setAnswer("");
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAnswer() {
    if (!answer.trim()) {
      setErr("Please provide an answer");
      return;
    }

    setSubmitting(true);
    setErr("");
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

      const updatedTurns = allTurns.map((t) =>
        t.id === currentTurn.id ? updatedTurn : t
      );

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
    } finally {
      setSubmitting(false);
    }
  }

  async function viewSession(sessionId) {
    setLoading(true);
    setErr("");
    try {
      const data = await api(`/api/interviews/sessions/${sessionId}`);
      setReviewSession(data.session);
      setAllTurns(data.turns || []);
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSession(sessionId) {
    if (!confirm("Delete this interview session?")) return;

    setErr("");
    try {
      await api(`/api/interviews/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (reviewSession?.id === sessionId) {
        setReviewSession(null);
        setAllTurns([]);
      }
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

  if (activeSession && currentTurn) {
    const isCompleted = currentTurn._justCompleted || !currentTurn.question;
    const answeredTurns = allTurns.filter((t) => t.user_answer);
    const currentQuestionNum = activeSession.current_question_number;

    if (isCompleted) {
      const avgScore = answeredTurns.reduce((sum, t) => sum + (t.ai_rating || 0), 0) / answeredTurns.length;

      return (
        <div className="page-content">
          <h2>Interview Complete! 🎉</h2>

          <Card className="mt-4 mb-4">
            <Card.Body>
              <h4>Overall Score: {avgScore.toFixed(1)}/5.0</h4>
              <Badge bg={getRatingColor(avgScore)} className="me-2">
                {getRatingLabel(avgScore)}
              </Badge>

              <div className="mt-4">
                <h5>Strengths:</h5>
                <ul>
                  {answeredTurns
                    .filter((t) => t.ai_rating >= 4.0)
                    .map((t, i) => (
                      <li key={i}>
                        Question {t.turn_number}: Strong answer (rated {t.ai_rating}/5.0)
                      </li>
                    ))}
                  {answeredTurns.filter((t) => t.ai_rating >= 4.0).length === 0 && (
                    <li>Keep practicing - you'll improve with more interviews!</li>
                  )}
                </ul>

                <h5>Areas to Improve:</h5>
                <ul>
                  {answeredTurns
                    .filter((t) => t.ai_rating < 3.5)
                    .map((t, i) => (
                      <li key={i}>
                        Question {t.turn_number}: {t.ai_feedback}
                      </li>
                    ))}
                  {answeredTurns.filter((t) => t.ai_rating < 3.5).length === 0 && (
                    <li>Great job! All answers were strong.</li>
                  )}
                </ul>
              </div>

              <div className="mt-4">
                <Button variant="primary" onClick={backToList} className="me-2">
                  Back to Interviews
                </Button>
                <Button variant="outline-primary" onClick={() => setShowNewForm(true)}>
                  Start Another Interview
                </Button>
              </div>
            </Card.Body>
          </Card>

          <h5>Full Interview Transcript:</h5>
          {allTurns.map((turn) => (
            <Card key={turn.id} className="mb-3">
              <Card.Body>
                <div className="mb-2">
                  <strong>Question {turn.turn_number}:</strong> {turn.question}
                </div>
                {turn.user_answer && (
                  <>
                    <div className="mb-2">
                      <strong>Your Answer:</strong> {turn.user_answer}
                    </div>
                    <div className="mb-2">
                      <Badge bg={getRatingColor(turn.ai_rating)}>
                        {turn.ai_rating}/5.0 - {getRatingLabel(turn.ai_rating)}
                      </Badge>
                    </div>
                    <div>
                      <strong>Feedback:</strong> {turn.ai_feedback}
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      );
    }

    const showFeedback = currentTurn.user_answer && currentTurn.ai_feedback;

    return (
      <div className="page-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Mock Interview</h2>
            <p className="text-muted mb-0">
              {activeSession.role_title} - {activeSession.mode} mode
            </p>
          </div>
          <Button variant="outline-secondary" onClick={backToList} size="sm">
            Exit Interview
          </Button>
        </div>

        {err && <Alert variant="danger">{err}</Alert>}

        <div className="mb-3">
          <Badge bg="primary">
            Question {currentQuestionNum} of {activeSession.total_questions}
          </Badge>
        </div>

        {!showFeedback ? (
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-4">{currentTurn.question}</h5>

              <Form.Group>
                <Form.Label>Your Answer:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here... (2-3 paragraphs recommended)"
                  disabled={submitting}
                />
              </Form.Group>

              <Button
                variant="primary"
                className="mt-3"
                onClick={submitAnswer}
                disabled={submitting || !answer.trim()}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Answer"
                )}
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">✓ Answer Submitted</h5>

              <div className="mb-3">
                <strong>Rating:</strong>{" "}
                <Badge bg={getRatingColor(currentTurn.ai_rating)} className="ms-2">
                  {currentTurn.ai_rating}/5.0 - {getRatingLabel(currentTurn.ai_rating)}
                </Badge>
              </div>

              <div className="mb-4">
                <strong>Feedback:</strong>
                <p className="mt-2">{currentTurn.ai_feedback}</p>
              </div>

              <Button
                variant="primary"
                onClick={() => {
                  setCurrentTurn(pendingNextTurn);
                  setActiveSession((prev) => ({
                    ...prev,
                    current_question_number: pendingNextTurn.turn_number,
                  }));
                  setPendingNextTurn(null);
                }}
              >
                Next Question
              </Button>
            </Card.Body>
          </Card>
        )}

        {allTurns.filter((t) => t.user_answer && t.id !== currentTurn.id).length > 0 && (
          <div className="mt-5">
            <h5>Previous Questions:</h5>
            {allTurns
              .filter((t) => t.user_answer && t.id !== currentTurn.id)
              .map((turn) => (
                <Card key={turn.id} className="mb-3" style={{ opacity: 0.8 }}>
                  <Card.Body>
                    <div className="mb-2">
                      <strong>Q{turn.turn_number}:</strong> {turn.question}
                    </div>
                    <div className="mb-2 text-muted" style={{ fontSize: "0.9em" }}>
                      <strong>Your Answer:</strong> {turn.user_answer.slice(0, 150)}
                      {turn.user_answer.length > 150 && "..."}
                    </div>
                    <Badge bg={getRatingColor(turn.ai_rating)} size="sm">
                      {turn.ai_rating}/5.0
                    </Badge>
                  </Card.Body>
                </Card>
              ))}
          </div>
        )}
      </div>
    );
  }

  if (reviewSession) {
    return (
      <div className="page-content">
        <Button variant="outline-secondary" onClick={backToList} className="mb-4" size="sm">
          ← Back to List
        </Button>

        <h2>Interview Review</h2>
        <p className="text-muted">
          {reviewSession.role_title} - {reviewSession.mode} mode -{" "}
          {fmt(reviewSession.created_at)}
        </p>

        {reviewSession.status === "completed" && (
          <Card className="mb-4">
            <Card.Body>
              <h4>Overall Score: {Number(reviewSession.average_score)?.toFixed(1) || "N/A"}/5.0</h4>
              <Badge bg={getRatingColor(reviewSession.average_score)}>
                {getRatingLabel(reviewSession.average_score)}
              </Badge>
            </Card.Body>
          </Card>
        )}

        <h5>Full Transcript:</h5>
        {allTurns.map((turn) => (
          <Card key={turn.id} className="mb-3">
            <Card.Body>
              <div className="mb-2">
                <strong>Question {turn.turn_number}:</strong> {turn.question}
              </div>
              {turn.user_answer ? (
                <>
                  <div className="mb-2">
                    <strong>Your Answer:</strong> {turn.user_answer}
                  </div>
                  <div className="mb-2">
                    <Badge bg={getRatingColor(turn.ai_rating)}>
                      {turn.ai_rating}/5.0 - {getRatingLabel(turn.ai_rating)}
                    </Badge>
                  </div>
                  <div>
                    <strong>Feedback:</strong> {turn.ai_feedback}
                  </div>
                </>
              ) : (
                <p className="text-muted">Not answered yet</p>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  }

  if (showNewForm) {
    return (
      <div className="page-content">
        <Button variant="outline-secondary" onClick={() => setShowNewForm(false)} className="mb-4" size="sm">
          ← Cancel
        </Button>

        <h2>Start New Interview</h2>

        {err && <Alert variant="danger">{err}</Alert>}

        <Card>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Target Role *</Form.Label>
              <Form.Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                <option value="">-- Select a role --</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Interview Type *</Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  id="mode-technical"
                  label="Technical (coding, system design, technical knowledge)"
                  value="technical"
                  checked={selectedMode === "technical"}
                  onChange={(e) => setSelectedMode(e.target.value)}
                />
                <Form.Check
                  type="radio"
                  id="mode-behavioral"
                  label="Behavioral (STAR method, soft skills, past experiences)"
                  value="behavioral"
                  checked={selectedMode === "behavioral"}
                  onChange={(e) => setSelectedMode(e.target.value)}
                />
                <Form.Check
                  type="radio"
                  id="mode-mixed"
                  label="Mixed (combination of technical and behavioral)"
                  value="mixed"
                  checked={selectedMode === "mixed"}
                  onChange={(e) => setSelectedMode(e.target.value)}
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Number of Questions</Form.Label>
              <Form.Select
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} questions
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Button variant="primary" onClick={startNewInterview} disabled={submitting || !selectedRole}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Starting...
                </>
              ) : (
                <>
                  <FiPlay className="me-2" />
                  Start Interview
                </>
              )}
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Mock Interviews</h2>
        <Button variant="primary" onClick={() => setShowNewForm(true)}>
          <FiPlay className="me-2" />
          Start New Interview
        </Button>
      </div>

      {err && <Alert variant="danger">{err}</Alert>}

      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <FiCheckCircle size={64} className="text-muted mb-3" />
            <h4>No interviews yet</h4>
            <p className="text-muted">Start your first mock interview to practice your skills!</p>
            <Button variant="primary" onClick={() => setShowNewForm(true)} className="mt-3">
              Start Interview
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div>
          {sessions.map((session) => (
            <Card key={session.id} className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <h5>{session.role_title}</h5>
                    <div className="text-muted mb-2">
                      <Badge bg="secondary" className="me-2">
                        {session.mode}
                      </Badge>
                      {session.status === "completed" ? (
                        <>
                          <Badge bg={getRatingColor(session.average_score)} className="me-2">
                            {Number(session.average_score)?.toFixed(1) || "N/A"}/5.0
                          </Badge>
                          <FiCheckCircle className="me-1" />
                          Completed
                        </>
                      ) : (
                        <>
                          <FiClock className="me-1" />
                          In Progress ({session.current_question_number}/{session.total_questions})
                        </>
                      )}
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.9em" }}>
                      {fmt(session.created_at)}
                    </div>
                  </div>

                  <div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => viewSession(session.id)}
                      className="me-2"
                    >
                      View
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => deleteSession(session.id)}
                    >
                      <FiTrash2 />
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}