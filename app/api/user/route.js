import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/lib/models/User";
import ResumeCache from "@/lib/models/ResumeCache";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const user = await User.findOne({ email: session.user.email }).lean();
  const cache = await ResumeCache.find({ userEmail: session.user.email })
    .sort({ createdAt: -1 }).limit(5).lean();
  return NextResponse.json({ user, cache });
}
