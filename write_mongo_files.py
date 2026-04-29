import os

dirs = [
    "lib/models",
    "app/api/auth/[...nextauth]",
    "app/api/user",
    "app/login",
    "app/settings",
    "components",
]
for d in dirs:
    os.makedirs(d, exist_ok=True)

files = {}

# ── MongoDB connection ────────────────────────────────────────
files["lib/mongoose.js"] = '''\
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI not defined in .env.local");

let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
'''

# ── User model ────────────────────────────────────────────────
files["lib/models/User.js"] = '''\
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email:          { type: String, required: true, unique: true },
  name:           { type: String },
  image:          { type: String },
  plan:           { type: String, default: "free" },
  analysesUsed:   { type: Number, default: 0 },
  analysesLimit:  { type: Number, default: 3 },
  resetDate:      { type: Date, default: () => new Date(Date.now() + 30*24*60*60*1000) },
  createdAt:      { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
'''

# ── Resume Cache model ────────────────────────────────────────
files["lib/models/ResumeCache.js"] = '''\
import mongoose from "mongoose";

const ResumeCacheSchema = new mongoose.Schema({
  userEmail:  { type: String, required: true },
  filename:   { type: String },
  score:      { type: Number },
  result:     { type: mongoose.Schema.Types.Mixed },
  createdAt:  { type: Date, default: Date.now },
});

export default mongoose.models.ResumeCache || mongoose.model("ResumeCache", ResumeCacheSchema);
'''

# ── NextAuth route ────────────────────────────────────────────
files["app/api/auth/[...nextauth]/route.js"] = '''\
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongoose";
import User from "@/lib/models/User";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      await connectDB();
      const existing = await User.findOne({ email: user.email });
      if (!existing) {
        await User.create({
          email: user.email,
          name: user.name,
          image: user.image,
        });
      }
      return true;
    },
    async session({ session }) {
      await connectDB();
      const dbUser = await User.findOne({ email: session.user.email });
      if (dbUser) {
        session.user.plan = dbUser.plan;
        session.user.analysesUsed = dbUser.analysesUsed;
        session.user.analysesLimit = dbUser.analysesLimit;
        session.user.resetDate = dbUser.resetDate;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
'''

# ── User API ──────────────────────────────────────────────────
files["app/api/user/route.js"] = '''\
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
'''

# ── Updated analyze route ─────────────────────────────────────
files["app/api/analyze/route.js"] = '''\
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

    const wordCount = resumeText.trim().split(/\\s+/).length;
    const ideas = await generateIdeas("[Word count: " + wordCount + "]\\n\\n" + resumeText);

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
'''

# ── Middleware ────────────────────────────────────────────────
files["middleware.js"] = '''\
export { default } from "next-auth/middleware";
export const config = {
  matcher: ["/", "/projects/:path*", "/settings/:path*"],
};
'''

# ── SessionProvider ───────────────────────────────────────────
files["components/SessionProvider.js"] = '''\
"use client";
import { SessionProvider } from "next-auth/react";
export default function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
'''

# ── Layout ────────────────────────────────────────────────────
files["app/layout.js"] = '''\
import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
export const metadata = { title: "ResuAI", description: "Turn your resume into your next big project" };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
        <style>{`*{box-sizing:border-box;margin:0;padding:0}.material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24}body{font-family:'Inter',sans-serif;background:#f9f9f9;color:#111;-webkit-font-smoothing:antialiased}`}</style>
      </head>
      <body style={{background:"#f9f9f9"}}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
'''

# ── Navbar with avatar ────────────────────────────────────────
files["components/Navbar.js"] = '''\
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Navbar({ showBack = false, subtitle = null }) {
  const { data: session } = useSession();
  const router = useRouter();
  const used = session?.user?.analysesUsed ?? 0;
  const limit = session?.user?.analysesLimit ?? 3;
  const remaining = limit - used;

  return (
    <header style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid #ebebeb"}}>
      <div style={{maxWidth:560,margin:"0 auto",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {showBack && (
            <button onClick={() => window.history.back()} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",color:"#666",padding:4,borderRadius:6}}>
              <span className="material-symbols-outlined" style={{fontSize:20}}>arrow_back</span>
            </button>
          )}
          <div>
            <div style={{fontSize:15,fontWeight:600,color:"#111",letterSpacing:"-0.3px"}}>ResuAI</div>
            {subtitle && <div style={{fontSize:11,color:"#999",marginTop:1,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{subtitle}</div>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {session && (
            <div style={{display:"flex",alignItems:"center",gap:5,background:remaining===0?"#fff5f5":remaining===1?"#fffbf0":"#f5f5f5",border:"1px solid "+(remaining===0?"#ffd0d0":remaining===1?"#ffe4a0":"#ebebeb"),borderRadius:20,padding:"4px 10px"}}>
              <span className="material-symbols-outlined" style={{fontSize:13,color:remaining===0?"#c0392b":remaining===1?"#a0620a":"#999"}}>bolt</span>
              <span style={{fontSize:11,fontWeight:600,color:remaining===0?"#c0392b":remaining===1?"#a0620a":"#777"}}>{remaining} left</span>
            </div>
          )}
          <button onClick={() => router.push("/settings")} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
            {session?.user?.image ? (
              <img src={session.user.image} alt="avatar" style={{width:32,height:32,borderRadius:"50%",border:"1.5px solid #ebebeb",display:"block"}} />
            ) : (
              <div style={{width:32,height:32,borderRadius:"50%",background:"#f0f0f0",border:"1px solid #e0e0e0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"#666"}}>
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
'''

# ── Login page ────────────────────────────────────────────────
files["app/login/page.js"] = '''\
"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.push("/");
  }, [status]);

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  }

  if (status === "loading") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f9f9f9"}}>
      <div style={{width:20,height:20,border:"2px solid #eee",borderTop:"2px solid #111",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f9f9f9",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <style>{"*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif}.material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24}"}</style>

      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:44,height:44,background:"#111",borderRadius:12,marginBottom:16}}>
            <span style={{color:"#fff",fontSize:20,fontWeight:700}}>R</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,color:"#111",letterSpacing:"-0.03em",marginBottom:8}}>Welcome to ResuAI</h1>
          <p style={{fontSize:14,color:"#999",lineHeight:1.6}}>Sign in to analyze your resume and track your projects.</p>
        </div>

        <div style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:20,padding:28,marginBottom:24}}>
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{width:"100%",padding:"14px 20px",background:"#fff",border:"1.5px solid #e0e0e0",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",gap:12,fontSize:14,fontWeight:600,color:"#333",cursor:loading?"not-allowed":"pointer",transition:"all 0.15s",marginBottom:20,opacity:loading?0.7:1}}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? "Signing in..." : "Continue with Google"}
          </button>

          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
            <div style={{flex:1,height:1,background:"#f0f0f0"}}/>
            <span style={{fontSize:11,color:"#ccc",fontWeight:500}}>COMING SOON</span>
            <div style={{flex:1,height:1,background:"#f0f0f0"}}/>
          </div>

          <button disabled style={{width:"100%",padding:"14px 20px",background:"#fafafa",border:"1.5px solid #f0f0f0",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",gap:12,fontSize:14,fontWeight:500,color:"#ccc",cursor:"not-allowed"}}>
            <span className="material-symbols-outlined" style={{fontSize:18,color:"#ddd"}}>phone</span>
            Continue with Phone
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[["bolt","3 free / month"],["shield","Private & secure"],["history","History saved"]].map(([icon,label]) => (
            <div key={label} style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
              <span className="material-symbols-outlined" style={{fontSize:18,color:"#bbb",display:"block",marginBottom:4}}>{icon}</span>
              <span style={{fontSize:10,color:"#bbb",fontWeight:500,lineHeight:1.3,display:"block"}}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
'''

# ── Settings page ─────────────────────────────────────────────
files["app/settings/page.js"] = '''\
"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("account");
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchUser();
  }, [status]);

  async function fetchUser() {
    try {
      const res = await fetch("/api/user");
      const json = await res.json();
      setUserData(json);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading || status === "loading") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f9f9f9"}}>
      <div style={{width:20,height:20,border:"2px solid #eee",borderTop:"2px solid #111",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  const user = userData?.user;
  const cache = userData?.cache || [];
  const used = user?.analysesUsed || 0;
  const limit = user?.analysesLimit || 3;
  const remaining = limit - used;
  const usedPct = Math.min(Math.round((used/limit)*100), 100);
  const barColor = usedPct >= 100 ? "#c0392b" : usedPct >= 66 ? "#a0620a" : "#111";

  const tabs = [
    {id:"account",label:"Account",icon:"person"},
    {id:"history",label:"History",icon:"history"},
    {id:"plan",label:"Plan",icon:"workspace_premium"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#f9f9f9",paddingBottom:80}}>
      <Navbar />
      <main style={{maxWidth:560,margin:"0 auto",padding:"80px 24px 0"}}>

        <div style={{paddingTop:32,marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,letterSpacing:"-0.03em",color:"#111",marginBottom:4}}>Settings</h1>
          <p style={{fontSize:13,color:"#aaa"}}>Manage your account and preferences</p>
        </div>

        {/* Profile card */}
        <div style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:16,padding:"18px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:14}}>
          {session?.user?.image ? (
            <img src={session.user.image} alt="avatar" style={{width:50,height:50,borderRadius:"50%",border:"2px solid #ebebeb"}}/>
          ) : (
            <div style={{width:50,height:50,borderRadius:"50%",background:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#666"}}>
              {session?.user?.name?.[0]?.toUpperCase()||"U"}
            </div>
          )}
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:600,color:"#111",marginBottom:2}}>{session?.user?.name||"User"}</div>
            <div style={{fontSize:12,color:"#aaa"}}>{session?.user?.email}</div>
          </div>
          <div style={{background:user?.plan==="pro"?"#111":"#f5f5f5",color:user?.plan==="pro"?"#fff":"#888",fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:20,letterSpacing:"0.05em"}}>
            {(user?.plan||"free").toUpperCase()}
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,marginBottom:20,background:"#f0f0f0",borderRadius:12,padding:4}}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{flex:1,padding:"9px 6px",background:activeTab===tab.id?"#fff":"transparent",border:"none",borderRadius:9,fontSize:12,fontWeight:600,color:activeTab===tab.id?"#111":"#999",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all 0.15s",boxShadow:activeTab===tab.id?"0 1px 4px rgba(0,0,0,0.08)":"none"}}>
              <span className="material-symbols-outlined" style={{fontSize:15}}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ACCOUNT TAB */}
        {activeTab==="account" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>

            {/* Usage */}
            <div style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:14,padding:"18px 20px"}}>
              <div style={{fontSize:11,fontWeight:600,color:"#bbb",letterSpacing:"0.05em",marginBottom:14}}>USAGE THIS MONTH</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10}}>
                <div>
                  <div style={{fontSize:28,fontWeight:700,color:barColor,letterSpacing:"-0.04em",lineHeight:1}}>{used}<span style={{fontSize:14,color:"#ccc",fontWeight:400}}>/{limit}</span></div>
                  <div style={{fontSize:12,color:"#aaa",marginTop:2}}>analyses used</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:14,fontWeight:700,color:remaining===0?"#c0392b":remaining===1?"#a0620a":"#2d7a4f"}}>{remaining} remaining</div>
                  <div style={{fontSize:11,color:"#ccc",marginTop:2}}>Resets {user?.resetDate ? new Date(user.resetDate).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "—"}</div>
                </div>
              </div>
              <div style={{height:6,background:"#f0f0f0",borderRadius:999}}>
                <div style={{height:6,borderRadius:999,background:barColor,width:usedPct+"%",transition:"width 0.6s ease"}}/>
              </div>
            </div>

            {/* Account info */}
            <div style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:14,overflow:"hidden"}}>
              {[["person","Name",session?.user?.name||"—"],["email","Email",session?.user?.email||"—"],["login","Signed in with","Google"]].map(([icon,label,value],i,arr) => (
                <div key={label} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",borderBottom:i<arr.length-1?"1px solid #f8f8f8":"none"}}>
                  <span className="material-symbols-outlined" style={{fontSize:18,color:"#ddd"}}>{icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:"#ccc",marginBottom:2}}>{label}</div>
                    <div style={{fontSize:13,color:"#333",fontWeight:500}}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => signOut({callbackUrl:"/login"})} style={{width:"100%",padding:"13px",background:"#fff",border:"1px solid #ffd0d0",borderRadius:12,fontSize:13,fontWeight:600,color:"#c0392b",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#fff5f5"}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}
            >
              <span className="material-symbols-outlined" style={{fontSize:16}}>logout</span>
              Sign out
            </button>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab==="history" && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {cache.length===0 ? (
              <div style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:16,padding:"48px 24px",textAlign:"center"}}>
                <span className="material-symbols-outlined" style={{fontSize:40,color:"#e0e0e0",display:"block",marginBottom:14}}>history</span>
                <div style={{fontSize:14,fontWeight:600,color:"#ccc",marginBottom:6}}>No history yet</div>
                <div style={{fontSize:12,color:"#ddd"}}>Your last 5 analyses will appear here.</div>
              </div>
            ) : (
              <>
                {cache.map((item,i) => {
                  const scoreColor = item.score>=80?"#2d7a4f":item.score>=60?"#a0620a":"#c0392b";
                  return (
                    <div key={i}
                      onClick={() => { sessionStorage.setItem("resumeResults", JSON.stringify(item.result)); router.push("/projects"); }}
                      style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:14,padding:"16px 20px",cursor:"pointer",transition:"all 0.15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.06)";e.currentTarget.style.borderColor="#ddd";}}
                      onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor="#ebebeb";}}
                    >
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <div style={{width:38,height:38,background:"#f8f8f8",border:"1px solid #ebebeb",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span className="material-symbols-outlined" style={{fontSize:18,color:"#bbb"}}>description</span>
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:"#111",marginBottom:2}}>{item.filename||"Resume.pdf"}</div>
                            <div style={{fontSize:11,color:"#bbb"}}>{new Date(item.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:22,fontWeight:700,color:scoreColor,letterSpacing:"-0.04em",lineHeight:1}}>{item.score}</div>
                          <div style={{fontSize:10,color:"#ccc"}}>/100</div>
                        </div>
                      </div>
                      <div style={{height:3,background:"#f5f5f5",borderRadius:999}}>
                        <div style={{height:3,borderRadius:999,background:scoreColor,width:item.score+"%"}}/>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:4,marginTop:10}}>
                        <span style={{fontSize:11,color:"#ccc"}}>Tap to view full results</span>
                        <span className="material-symbols-outlined" style={{fontSize:13,color:"#ddd"}}>arrow_forward</span>
                      </div>
                    </div>
                  );
                })}
                <div style={{textAlign:"center",marginTop:4}}>
                  <span style={{fontSize:11,color:"#ccc"}}>{cache.length} of 5 maximum saved analyses</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* PLAN TAB */}
        {activeTab==="plan" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Current plan */}
            <div style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:14,padding:"20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:"#bbb",letterSpacing:"0.05em",marginBottom:4}}>CURRENT PLAN</div>
                  <div style={{fontSize:22,fontWeight:700,color:"#111",letterSpacing:"-0.03em"}}>Free</div>
                </div>
                <div style={{background:"#f5f5f5",border:"1px solid #ebebeb",borderRadius:10,padding:"6px 14px",fontSize:11,fontWeight:700,color:"#999",letterSpacing:"0.05em"}}>FREE</div>
              </div>
              {[["3 analyses per month",true],["Last 5 results saved",true],["GitHub README generation",true],["Unlimited analyses",false],["Priority AI responses",false],["PDF export",false]].map(([label,included]) => (
                <div key={label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <span className="material-symbols-outlined" style={{fontSize:16,color:included?"#2d7a4f":"#e0e0e0"}}>{included?"check":"close"}</span>
                  <span style={{fontSize:13,color:included?"#333":"#bbb"}}>{label}</span>
                </div>
              ))}
            </div>

            {/* Pro card */}
            <div style={{background:"#111",borderRadius:14,padding:"22px",color:"#fff",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:120,height:120,background:"rgba(255,255,255,0.04)",borderRadius:"50%"}}/>
              <div style={{position:"absolute",bottom:-30,left:-20,width:80,height:80,background:"rgba(255,255,255,0.03)",borderRadius:"50%"}}/>
              <div style={{position:"relative"}}>
                <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.35)",letterSpacing:"0.06em",marginBottom:4}}>UPGRADE TO</div>
                <div style={{fontSize:24,fontWeight:700,letterSpacing:"-0.04em",marginBottom:4}}>Pro Plan</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:18}}>Unlimited analyses, every month</div>
                {[["Unlimited analyses","all_inclusive"],["All free features","check_circle"],["Priority AI model","speed"]].map(([label,icon]) => (
                  <div key={label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <span className="material-symbols-outlined" style={{fontSize:15,color:"rgba(255,255,255,0.5)"}}>{icon}</span>
                    <span style={{fontSize:12,color:"rgba(255,255,255,0.65)"}}>{label}</span>
                  </div>
                ))}
                <button style={{marginTop:16,width:"100%",padding:"13px",background:"#fff",color:"#111",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:"-0.2px"}}>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      <BottomNav />
    </div>
  );
}
'''

for path, content in files.items():
    dirpath = os.path.dirname(path)
    if dirpath:
        os.makedirs(dirpath, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Written: {path}")

print("\nAll files written successfully!")