import { NextResponse } from "next/server";
import { parseResume } from "@/lib/parseResume";
import { generateIdeas } from "@/lib/generateIdeas";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const resumeText = await parseResume(buffer);

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not read resume text. Make sure it's a text-based PDF, not a scanned image." },
        { status: 400 }
      );
    }

    // Pass word count to help with scoring context
    const wordCount = resumeText.trim().split(/\s+/).length;
    const enrichedText = `[Word count: ${wordCount}]\n\n${resumeText}`;

    const ideas = await generateIdeas(enrichedText);

    return NextResponse.json({ success: true, data: ideas });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Something went wrong: " + error.message },
      { status: 500 }
    );
  }
}