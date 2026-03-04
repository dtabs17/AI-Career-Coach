function parseEvaluationResponse(responseText) {
  try {
    const parsed   = JSON.parse(responseText);
    const rating   = Number(parsed.rating)   || 3.0;
    const feedback = String(parsed.feedback  || "Good effort. Keep practicing your interview skills.");
    const clampedRating = Math.max(1.0, Math.min(5.0, rating));
    return {
      rating:   clampedRating,
      feedback: feedback.slice(0, 1000),
    };
  } catch {
    return {
      rating:   3.0,
      feedback: "Good effort. Consider providing more specific examples and details in your answer.",
    };
  }
}

function buildFallbackReply(assistantText) {
  return (assistantText || "").trim() || "I could not generate a response. Try again.";
}

module.exports = { parseEvaluationResponse, buildFallbackReply };