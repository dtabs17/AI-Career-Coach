/**
 * Unit tests for parsing model output and fallback reply construction.
 */

const {
  parseEvaluationResponse,
  buildFallbackReply,
} = require("../utils/openai_utils");



describe("parseEvaluationResponse() - valid JSON", () => {
  test("extracts rating and feedback from a well-formed response", () => {
    const result = parseEvaluationResponse(
      JSON.stringify({ rating: 4.0, feedback: "Strong answer with clear examples." })
    );
    expect(result.rating).toBe(4.0);
    expect(result.feedback).toBe("Strong answer with clear examples.");
  });

  test("returns a number for rating, not a string", () => {
    const result = parseEvaluationResponse(
      JSON.stringify({ rating: 3.5, feedback: "Decent." })
    );
    expect(typeof result.rating).toBe("number");
  });

  test("returns a string for feedback", () => {
    const result = parseEvaluationResponse(
      JSON.stringify({ rating: 2.0, feedback: "Needs more detail." })
    );
    expect(typeof result.feedback).toBe("string");
  });

  test("clamps rating above 5.0 down to 5.0", () => {
    const result = parseEvaluationResponse(
      JSON.stringify({ rating: 9.5, feedback: "Way too high." })
    );
    expect(result.rating).toBe(5.0);
  });

  test("clamps rating below 1.0 up to 1.0", () => {
    const result = parseEvaluationResponse(
      JSON.stringify({ rating: 0.2, feedback: "Way too low." })
    );
    expect(result.rating).toBe(1.0);
  });

  test("a rating of exactly 1.0 passes through the clamp unchanged", () => {
    const result = parseEvaluationResponse(
      JSON.stringify({ rating: 1.0, feedback: "Minimum." })
    );
    expect(result.rating).toBe(1.0);
  });

  test("a rating of exactly 5.0 passes through the clamp unchanged", () => {
    const result = parseEvaluationResponse(
      JSON.stringify({ rating: 5.0, feedback: "Maximum." })
    );
    expect(result.rating).toBe(5.0);
  });

  test("feedback longer than 1000 characters is truncated to 1000", () => {
    const longFeedback = "x".repeat(1200);
    const result = parseEvaluationResponse(
      JSON.stringify({ rating: 3.0, feedback: longFeedback })
    );
    expect(result.feedback.length).toBe(1000);
  });

  test("missing rating field defaults to 3.0", () => {
    const result = parseEvaluationResponse(
      JSON.stringify({ feedback: "No rating in this response." })
    );
    expect(result.rating).toBe(3.0);
  });

  test("missing feedback field defaults to a non-empty string", () => {
    const result = parseEvaluationResponse(
      JSON.stringify({ rating: 4.0 })
    );
    expect(result.feedback.length).toBeGreaterThan(0);
  });
});


describe("parseEvaluationResponse() - invalid or unexpected input", () => {
  test("returns default rating 3.0 for non-JSON input", () => {
    const result = parseEvaluationResponse("This is not JSON at all");
    expect(result.rating).toBe(3.0);
  });

  test("returns a non-empty feedback string for non-JSON input", () => {
    const result = parseEvaluationResponse("This is not JSON at all");
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  test("returns default rating 3.0 for an empty string", () => {
    const result = parseEvaluationResponse("");
    expect(result.rating).toBe(3.0);
  });

  test("returns default rating 3.0 for a partial/truncated JSON string", () => {
    const result = parseEvaluationResponse('{"rating": 4.0, "feedback":');
    expect(result.rating).toBe(3.0);
  });

  test("does not throw for any string input", () => {
    const inputs = ["", "null", "[]", "{}", "undefined", "true", "123"];
    for (const input of inputs) {
      expect(() => parseEvaluationResponse(input)).not.toThrow();
    }
  });
});


// Fallback replies are used when the model response is empty or malformed, so
// the helper should always produce something safe to show in the UI.
describe("buildFallbackReply()", () => {
  const FALLBACK = "I could not generate a response. Try again.";

  test("returns the original text when it is non-empty", () => {
    expect(buildFallbackReply("Here is my advice.")).toBe("Here is my advice.");
  });

  test("trims leading and trailing whitespace from the returned text", () => {
    expect(buildFallbackReply("  trimmed  ")).toBe("trimmed");
  });

  test("returns the fallback message for an empty string", () => {
    expect(buildFallbackReply("")).toBe(FALLBACK);
  });

  test("returns the fallback message for a whitespace-only string", () => {
    expect(buildFallbackReply("     ")).toBe(FALLBACK);
  });

  test("returns the fallback message for null", () => {
    expect(buildFallbackReply(null)).toBe(FALLBACK);
  });

  test("returns the fallback message for undefined", () => {
    expect(buildFallbackReply(undefined)).toBe(FALLBACK);
  });

  test("does not modify text that contains only internal whitespace", () => {
    expect(buildFallbackReply("hello world")).toBe("hello world");
  });
});