import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateIdeas(resumeText) {
  const prompt = `
You are a world-class senior software engineer and career strategist.
Analyze the resume below deeply. Your job has two parts:

PART 1 — Resume Analysis:
- Extract the person's current skills (languages, frameworks, tools)
- Identify skill gaps: important technologies missing from their profile based on their career level and domain
- Score their resume from 0 to 100 based on: clarity, impact, technical depth, and relevance
- Give short feedback for each scoring category

PART 2 — Project Ideas:
Generate exactly 3 personalized project ideas that:
- Address their skill gaps
- Build on their existing strengths
- Are realistic to build in 2–4 weeks solo
- Would genuinely impress employers in their field

Return ONLY valid JSON, no markdown, no extra text:
{
  "analysis": {
    "currentSkills": ["skill1", "skill2"],
    "skillGaps": ["gap1", "gap2", "gap3"],
    "resumeScore": 74,
    "scoreFeedback": {
      "clarity": "Clear section headers but bullet points lack measurable impact.",
      "technicalDepth": "Good range of languages but missing cloud or DevOps exposure.",
      "impact": "Few quantified achievements — add numbers where possible.",
      "relevance": "Well aligned to backend roles."
    }
  },
  "projects": [
    {
      "title": "Project Name",
      "description": "What it does and why it's valuable. 2-3 sentences.",
      "difficulty": "Beginner | Intermediate | Advanced",
      "techStack": ["Tech1", "Tech2", "Tech3"],
      "skillsGained": ["skill1", "skill2"],
      "whyItFits": "One sentence connecting this to their specific background.",
      "architecture": "Brief description of how the system is structured (2 sentences).",
      "roadmap": [
        "Step 1: ...",
        "Step 2: ...",
        "Step 3: ...",
        "Step 4: ...",
        "Step 5: ..."
      ]
    }
  ]
}

RESUME:
${resumeText}
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  const raw = response.choices[0].message.content;
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}