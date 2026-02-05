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

module.exports = { generateCoachReply };
