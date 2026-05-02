files = {}

files["app/page.js"] = '''\
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const { status } = useSession();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const router = useRouter();

  // Show spinner while checking session
  if (status === "loading") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",
      justifyContent:"center",background:"#f9f9f9"}}>
      <div style={{width:20,height:20,border:"2px solid #eee",
        borderTop:"2px solid #111",borderRadius:"50%",
        animation:"spin 0.8s linear infinite"}}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  // Redirect to login immediately if not signed in
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      sessionStorage.setItem("resumeResults", JSON.stringify(json.data));
      router.push("/projects");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:"100vh",background:"#f9f9f9",paddingBottom:80}}>
      <Navbar />
      <main style={{maxWidth:560,margin:"0 auto",padding:"80px 24px 0"}}>
        <div style={{paddingTop:48,paddingBottom:40}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,
            background:"#f0f0f0",border:"1px solid #e8e8e8",borderRadius:20,
            padding:"4px 12px",marginBottom:20}}>
            <span className="material-symbols-outlined"
              style={{fontSize:14,color:"#888"}}>auto_awesome</span>
            <span style={{fontSize:11,fontWeight:500,color:"#888",
              letterSpacing:"0.04em"}}>AI POWERED</span>
          </div>
          <h1 style={{fontSize:"clamp(26px,5vw,36px)",fontWeight:700,
            letterSpacing:"-0.03em",lineHeight:1.15,color:"#111",marginBottom:14}}>
            Turn your resume into<br/>your next big project.
          </h1>
          <p style={{fontSize:15,color:"#888",lineHeight:1.6,maxWidth:420}}>
            Upload your PDF. Get a skill gap analysis, resume score,
            and 3 personalized project ideas in seconds.
          </p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault(); setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) setFile(f);
          }}
          onClick={() => document.getElementById("file-input").click()}
          style={{border:drag?"1.5px dashed #999":file?"1.5px dashed #bbb":
            "1.5px dashed #ddd",borderRadius:16,padding:"40px 24px",
            textAlign:"center",background:drag?"#f5f5f5":file?"#fafafa":"#fff",
            transition:"all 0.2s",cursor:"pointer",marginBottom:16}}
        >
          <input id="file-input" type="file" accept=".pdf"
            style={{display:"none"}}
            onChange={(e) => setFile(e.target.files[0])} />
          <div style={{width:48,height:48,borderRadius:12,background:"#f0f0f0",
            display:"flex",alignItems:"center",justifyContent:"center",
            margin:"0 auto 14px"}}>
            <span className="material-symbols-outlined"
              style={{fontSize:22,color:"#888"}}>upload_file</span>
          </div>
          {file ? (
            <div>
              <div style={{fontSize:14,fontWeight:600,color:"#111",
                marginBottom:4}}>{file.name}</div>
              <div style={{fontSize:12,color:"#aaa"}}>
                {(file.size/1024).toFixed(0)} KB</div>
            </div>
          ) : (
            <div>
              <div style={{fontSize:14,fontWeight:500,color:"#333",
                marginBottom:6}}>Drop your resume here</div>
              <div style={{fontSize:12,color:"#bbb"}}>
                or click to browse — PDF only — max 10MB</div>
            </div>
          )}
        </div>

        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {[["bolt","Instant results"],["shield","Private"],
            ["stars","AI-powered"]].map(([icon,label]) => (
            <div key={label} style={{flex:1,display:"flex",alignItems:"center",
              justifyContent:"center",gap:5,background:"#fff",
              border:"1px solid #ebebeb",borderRadius:10,padding:"8px 4px"}}>
              <span className="material-symbols-outlined"
                style={{fontSize:14,color:"#999"}}>{icon}</span>
              <span style={{fontSize:11,color:"#999",fontWeight:500}}>
                {label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{background:"#fff5f5",border:"1px solid #ffd0d0",
            borderRadius:10,padding:"12px 16px",fontSize:13,color:"#c00",
            marginBottom:16}}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          style={{width:"100%",padding:"15px 24px",borderRadius:12,
            border:"none",background:(!file||loading)?"#e8e8e8":"#111",
            color:(!file||loading)?"#aaa":"#fff",fontSize:14,fontWeight:600,
            cursor:(!file||loading)?"not-allowed":"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
            gap:8,transition:"all 0.2s"}}
        >
          {loading ? "Analyzing resume..." : "Analyze My Resume"}
        </button>

        <div style={{display:"flex",alignItems:"center",gap:12,margin:"32px 0"}}>
          <div style={{flex:1,height:1,background:"#ebebeb"}} />
          <span style={{fontSize:11,color:"#ccc",fontWeight:500}}>OR EXPLORE</span>
          <div style={{flex:1,height:1,background:"#ebebeb"}} />
        </div>

        {[["Browse templates","grid_view"],
          ["View success stories","workspace_premium"]].map(([label,icon]) => (
          <button key={label} style={{width:"100%",padding:"14px 18px",
            background:"#fff",border:"1px solid #ebebeb",borderRadius:12,
            display:"flex",alignItems:"center",justifyContent:"space-between",
            fontSize:13,fontWeight:500,color:"#333",cursor:"pointer",
            marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span className="material-symbols-outlined"
                style={{fontSize:18,color:"#bbb"}}>{icon}</span>
              {label}
            </div>
            <span className="material-symbols-outlined"
              style={{fontSize:16,color:"#ccc"}}>chevron_right</span>
          </button>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
'''

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
    // Already signed in — go straight to home
    if (status === "authenticated") router.replace("/");
  }, [status]);

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  }

  if (status === "loading" || status === "authenticated") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",
      justifyContent:"center",background:"#f9f9f9"}}>
      <div style={{width:20,height:20,border:"2px solid #eee",
        borderTop:"2px solid #111",borderRadius:"50%",
        animation:"spin 0.8s linear infinite"}}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f9f9f9",display:"flex",
      flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:24}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <style>{"*{box-sizing:border-box}body{font-family:'Inter',sans-serif}.material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24}"}</style>

      <div style={{width:"100%",maxWidth:400}}>

        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{display:"inline-flex",alignItems:"center",
            justifyContent:"center",width:48,height:48,background:"#111",
            borderRadius:12,marginBottom:16}}>
            <span style={{color:"#fff",fontSize:22,fontWeight:700}}>R</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,color:"#111",
            letterSpacing:"-0.03em",marginBottom:8,fontFamily:"Inter,sans-serif"}}>
            Welcome to ResuAI</h1>
          <p style={{fontSize:14,color:"#999",lineHeight:1.6,
            fontFamily:"Inter,sans-serif"}}>
            Sign in to analyze your resume and track your projects.</p>
        </div>

        <div style={{background:"#fff",border:"1px solid #ebebeb",
          borderRadius:20,padding:28,marginBottom:24}}>

          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{width:"100%",padding:"14px 20px",background:"#fff",
              border:"1.5px solid #e0e0e0",borderRadius:12,display:"flex",
              alignItems:"center",justifyContent:"center",gap:12,fontSize:14,
              fontWeight:600,color:"#333",
              cursor:loading?"not-allowed":"pointer",
              opacity:loading?0.7:1,marginBottom:20,fontFamily:"Inter,sans-serif"}}
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

          <button disabled style={{width:"100%",padding:"14px 20px",
            background:"#fafafa",border:"1.5px solid #f0f0f0",borderRadius:12,
            display:"flex",alignItems:"center",justifyContent:"center",gap:12,
            fontSize:14,fontWeight:500,color:"#ccc",cursor:"not-allowed",
            fontFamily:"Inter,sans-serif"}}>
            <span className="material-symbols-outlined"
              style={{fontSize:18,color:"#ddd"}}>phone</span>
            Continue with Phone
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[["bolt","3 free / month"],["shield","Private"],
            ["history","History saved"]].map(([icon,label]) => (
            <div key={label} style={{background:"#fff",border:"1px solid #ebebeb",
              borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
              <span className="material-symbols-outlined"
                style={{fontSize:18,color:"#bbb",display:"block",
                  marginBottom:4}}>{icon}</span>
              <span style={{fontSize:10,color:"#bbb",fontWeight:500,
                lineHeight:1.3,display:"block",fontFamily:"Inter,sans-serif"}}>
                {label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
'''

import os
for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Written: {path}")
print("Done!")