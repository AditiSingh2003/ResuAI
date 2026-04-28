import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  try {
    const { project } = await request.json();

    const prompt = `
You are a senior developer. Generate a professional GitHub README.md for this project.

Project details:
- Title: ${project.title}
- Description: ${project.description}
- Tech Stack: ${project.techStack.join(", ")}
- Architecture: ${project.architecture}
- Roadmap steps: ${project.roadmap.join(" | ")}

Write a complete README.md with these sections:
# Project Title
## About
## Tech Stack
## Features
## Getting Started (prerequisites, installation, running locally)
## Project Structure
## Roadmap
## Contributing
## License

Make it detailed, professional, and ready to paste into GitHub.
Return ONLY the raw markdown, no explanation, no code fences.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const readme = response.choices[0].message.content;
    return NextResponse.json({ success: true, readme });
  } catch (error) {
    console.error("README error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}