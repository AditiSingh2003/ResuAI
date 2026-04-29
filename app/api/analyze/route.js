import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parseResume } from "@/lib/parseResume";
import { generateIdeas } from "@/lib/generateIdeas";
import { connectDB } from "@/lib/mongoose";
import User from "@/lib/models/User";
import ResumeCache from "@/lib/models/ResumeCache";

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Please sign in to analyze your resume." }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    // Reset monthly limit if needed
    if (new Date() > new Date(user.resetDate)) {
      user.analysesUsed = 0;
      user.resetDate = new Date(Date.now() + 30*24*60*60*1000);
      await user.save();
    }

    // Check limit
    if (user.analysesUsed >= user.analysesLimit) {
      return NextResponse.json({
        error: "Monthly limit reached. You have used all " + user.analysesLimit + " analyses this month.",
        limitReached: true,
        used: user.analysesUsed,
        limit: user.analysesLimit,
      }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("resume");
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const resumeText = await parseResume(buffer);

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Could not read resume text." }, { status: 400 });
    }

    const wordCount = resumeText.trim().split(/\s+/).length;
    const ideas = await generateIdeas("[Word count: " + wordCount + "]\n\n" + resumeText);

    // Increment usage
    user.analysesUsed += 1;
    await user.save();

    // Save to cache
    await ResumeCache.create({
      userEmail: user.email,
      filename: file.name,
      score: ideas.analysis?.resumeScore || 0,
      result: ideas,
    });

    // Keep only last 5
    const all = await ResumeCache.find({ userEmail: user.email }).sort({ createdAt: 1 });
    if (all.length > 5) {
      const toDelete = all.slice(0, all.length - 5).map(r => r._id);
      await ResumeCache.deleteMany({ _id: { $in: toDelete } });
    }

    return NextResponse.json({
      success: true,
      data: ideas,
      usage: { used: user.analysesUsed, limit: user.analysesLimit },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Something went wrong: " + error.message }, { status: 500 });
  }
}
