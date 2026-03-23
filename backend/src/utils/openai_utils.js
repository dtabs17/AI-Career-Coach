/**
 * Parses a JSON evaluation response from the OpenAI API and returns a
 * normalised rating and feedback string.
 *
 * The rating is clamped to [1.0, 5.0] because the model occasionally returns
 * values outside that range on ambiguous or very short answers. Feedback is
 * truncated at 1000 characters to stay within database column limits.
 * Falls back to a neutral score of 3.0 if the response cannot be parsed.
 *
 * @param {string} responseText - Raw JSON string from the OpenAI completion.
 * @returns {{ rating: number, feedback: string }} Normalised evaluation result.
 */

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
    // Response was not valid JSON; return a neutral score rather than failing the request.
    return {
      rating:   3.0,
      feedback: "Good effort. Consider providing more specific examples and details in your answer.",
    };
  }
}

/**
 * Returns the assistant's reply text, or a safe fallback message if the
 * OpenAI call produced an empty or whitespace-only string.
 *
 * @param {string} assistantText - Text returned by the OpenAI chat completion.
 * @returns {string} Non-empty reply string.
 */
function buildFallbackReply(assistantText) {
  return (assistantText || "").trim() || "I could not generate a response. Try again.";
}

module.exports = { parseEvaluationResponse, buildFallbackReply };