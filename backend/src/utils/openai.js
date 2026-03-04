let clientPromise = null;

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
        `Preferred roles: ${
          Array.isArray(profile.preferred_roles) ? profile.preferred_roles.join(", ") : "None"
        }`,
        `Preferred technologies: ${
          Array.isArray(profile.preferred_technologies) ? profile.preferred_technologies.join(", ") : "None"
        }`,
      ].join("\n")
    : "No profile saved yet.";

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
    "Prefer step-by-step guidance, checklists, and short examples.",
    "Do not invent user achievements. If info is missing, ask a short clarifying question.",
    "",
    "Student context:",
    profileLine,
    "",
    "Student skills (self-reported):",
    skillLine,
  ].join("\n");

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "developer", content: instructions }, ...messages],
    temperature: 0.6,
  });

  const text = completion?.choices?.[0]?.message?.content;
  return (text || "").trim();
}

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

async function evaluateAnswer({ question, answer, roleTitle, mode }) {
  const client = await getClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const prompt = `You are evaluating a mock interview answer for the role: "${roleTitle}".

Question: ${question}

Candidate's Answer: ${answer}

Evaluate this answer and provide:
1. A rating from 1.0 to 5.0 (1=Poor, 2=Fair, 3=Good, 4=Very Good, 5=Excellent)
2. Constructive feedback (2-3 sentences)

Consider:
- Clarity and structure
- Relevance to the question
- Specific examples (if behavioral question)
- Technical accuracy (if technical question)
- Areas for improvement

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
  
  try {
    const parsed = JSON.parse(responseText);
    const rating = Number(parsed.rating) || 3.0;
    const feedback = String(parsed.feedback || "Good effort. Keep practicing your interview skills.");
    const clampedRating = Math.max(1.0, Math.min(5.0, rating));
    
    return {
      rating: clampedRating,
      feedback: feedback.slice(0, 1000),
    };
  } catch (err) {
    return {
      rating: 3.0,
      feedback: "Good effort. Consider providing more specific examples and details in your answer.",
    };
  }
}

module.exports = { generateCoachReply, generateInterviewQuestion, evaluateAnswer };
