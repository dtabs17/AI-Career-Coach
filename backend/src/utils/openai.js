const { parseEvaluationResponse } = require("./openai_utils");


// Module-level singleton. The OpenAI client is initialised once and reused
// across all requests. Storing a promise rather than the resolved client means
// concurrent calls on startup will all await the same initialisation rather
// than creating multiple instances.
let clientPromise = null;

/**
 * Returns a shared OpenAI client instance, initialising it on the first call.
 *
 * The openai package is imported dynamically because it is an ES module and
 * cannot be required with CommonJS require() at the top level.
 *
 * @returns {Promise<import("openai").default>} Resolved OpenAI client.
 */
async function getClient() {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const mod = await import("openai");
    const OpenAI = mod.default;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  })();

  return clientPromise;
}

/**
 * Calls the OpenAI chat completions API and returns a career coaching reply
 * personalised to the student's profile and current skill set.
 *
 * @param {object} params
 * @param {Array<{role: string, content: string}>} params.messages - Conversation history to send.
 * @param {object|null} params.profile - Student profile from the profiles table.
 * @param {Array<{name: string, proficiency_level: number}>} params.skills - User's saved skills.
 * @returns {Promise<string>} The assistant's reply text.
 */
async function generateCoachReply({ messages, profile, skills }) {
  const client = await getClient();

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const profileLine = profile
    ? [
      `Name: ${profile.full_name || "Unknown"}`,
      `Year: ${profile.year_of_study || "Unknown"}`,
      `Course: ${profile.course || "Unknown"}`,
      `Academic focus: ${profile.academic_focus || "Unknown"}`,
      `Interests: ${profile.interests || "Unknown"}`,
      `Preferred roles: ${Array.isArray(profile.preferred_roles) ? profile.preferred_roles.join(", ") : "None"
      }`,
      `Preferred technologies: ${Array.isArray(profile.preferred_technologies) ? profile.preferred_technologies.join(", ") : "None"
      }`,
    ].join("\n")
    : "No profile saved yet.";

  // Skills are capped at 50 entries to stay within the model's context budget
  // without meaningfully reducing the quality of coaching advice.
  const skillLine =
    skills && skills.length
      ? skills
        .slice(0, 50)
        .map((s) => `${s.name} (level ${s.proficiency_level})`)
        .join(", ")
      : "No skills saved yet.";

  const instructions = [
    "You are a career coach for IT students.",
    "Be practical, concise, and actionable.",
    "Focus on career guidance: milestones, goals, priorities, and next steps.",
    "Do not write code blocks or step-by-step technical tutorials. If the user wants implementation help, point them to the right resource or tool instead.",
    "When suggesting projects or learning paths, give checklists of milestones and outcomes, not instructions on how to build them.",
    "Do not make salary guarantees or employment predictions. If asked, acknowledge you cannot predict outcomes and suggest speaking to a careers advisor or industry professional.",
    "Do not invent user achievements. If info is missing, ask a short clarifying question.",
    "",
    "Student context:",
    profileLine,
    "",
    "Student skills (self-reported):",
    skillLine,
  ].join("\n");

  // The "developer" role is used instead of "system" as required by the GPT-4o API.
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "developer", content: instructions }, ...messages],
    temperature: 0.6,
  });

  const text = completion?.choices?.[0]?.message?.content;
  return (text || "").trim();
}

/**
 * Generates a single interview question for the given role and turn number.
 *
 * In mixed mode, questions alternate between technical and behavioral so the
 * session covers both types across its full length.
 *
 * @param {object} params
 * @param {string} params.roleTitle - Title of the career role being interviewed for.
 * @param {string} params.mode - One of "technical", "behavioral", or "mixed".
 * @param {number} params.turnNumber - Current question number (1-indexed).
 * @param {number} params.totalQuestions - Total number of questions in the session.
 * @param {Array<{turn_number: number, question: string}>} params.previousTurns - Earlier questions, used to avoid repetition.
 * @returns {Promise<string>} The generated question text.
 */
async function generateInterviewQuestion({ roleTitle, mode, turnNumber, totalQuestions, previousTurns }) {
  const client = await getClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  let modeInstructions = "";
  if (mode === "technical") {
    modeInstructions = "Focus on technical skills, coding problems, system design, and technical knowledge related to this role.";
  } else if (mode === "behavioral") {
    modeInstructions = "Focus on behavioral questions using the STAR method (Situation, Task, Action, Result). Ask about past experiences, teamwork, conflict resolution, and soft skills.";
  } else {
    const isTechnical = turnNumber % 2 === 1;
    modeInstructions = isTechnical
      ? "Ask a technical question about skills, tools, or problem-solving for this role."
      : "Ask a behavioral question about teamwork, challenges, or professional experiences using STAR method.";
  }

  const context = previousTurns && previousTurns.length > 0
    ? `Previous questions in this interview:\n${previousTurns.map(t => `Q${t.turn_number}: ${t.question}`).join("\n")}`
    : "This is the first question.";

  const prompt = `You are conducting a mock interview for the role: "${roleTitle}".

This is question ${turnNumber} of ${totalQuestions}.
Mode: ${mode}

${modeInstructions}

${context}

Generate one interview question that:
- Is appropriate for an entry-level IT student
- Is realistic for actual interviews
- Doesn't repeat previous topics
- Can be answered in 2-3 paragraphs

Return ONLY the question text, no preamble.`;

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 200,
  });

  const question = completion?.choices?.[0]?.message?.content;
  return (question || "Tell me about yourself and why you're interested in this role.").trim();
}

/**
 * Sends a candidate's answer to the OpenAI API for evaluation and returns a
 * rating and written feedback.
 *
 * response_format is set to json_object to use OpenAI's structured output mode,
 * which guarantees the response is valid JSON. This avoids parsing failures that
 * occur when the model wraps its output in markdown code fences.
 *
 * @param {object} params
 * @param {string} params.question - The interview question that was asked.
 * @param {string} params.answer - The candidate's answer text.
 * @param {string} params.roleTitle - Title of the role being interviewed for.
 * @param {string} params.mode - Interview mode ("technical", "behavioral", or "mixed").
 * @returns {Promise<{rating: number, feedback: string}>} Parsed evaluation result.
 */
async function evaluateAnswer({ question, answer, roleTitle, mode }) {
  const client = await getClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const prompt = `You are an expert interview coach evaluating a mock interview answer for the role: "${roleTitle}".

Question asked: ${question}

Candidate's answer: ${answer}

Your role is not just to grade but to teach. Write feedback that genuinely helps the candidate improve. Your feedback must cover all four of these points in flowing prose (not bullet points or numbered lists):

1. What worked: Briefly acknowledge any strong elements. If nothing was strong, skip this and move straight to the gaps.
2. What was missing or weak: Be precise, not vague. Do not say "add more detail". Instead say exactly what detail was missing and why it matters for this specific question and role.
3. A stronger answer would: Give a concise example of what a high-scoring answer to THIS specific question should have included. For behavioral questions, outline the key STAR beats a strong answer would hit. For technical questions, name the concepts, steps, or trade-offs that should have been mentioned.
4. One takeaway: End with a single, immediately actionable tip for the next question.

Rating scale: 1.0 = very poor, 2.0 = fair, 3.0 = adequate, 4.0 = strong, 5.0 = excellent.

Write the feedback as a single natural paragraph between 100 and 160 words. Be direct and specific to this question. NEVER give generic advice that could apply to any answer.

Respond in this exact JSON format:
{
  "rating": <number between 1.0 and 5.0>,
  "feedback": "<your feedback text>"
}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  const responseText = completion?.choices?.[0]?.message?.content || "{}";
  return parseEvaluationResponse(responseText);
}

module.exports = { generateCoachReply, generateInterviewQuestion, evaluateAnswer };