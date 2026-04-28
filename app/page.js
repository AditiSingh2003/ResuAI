"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const router = useRouter();

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
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#f0f0f0",border:"1px solid #e8e8e8",borderRadius:20,padding:"4px 12px",marginBottom:20}}>
            <span className="material-symbols-outlined" style={{fontSize:14,color:"#888"}}>auto_awesome</span>
            <span style={{fontSize:11,fontWeight:500,color:"#888",letterSpacing:"0.04em"}}>AI POWERED</span>
          </div>
          <h1 style={{fontSize:"clamp(26px,5vw,36px)",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1.15,color:"#111",marginBottom:14}}>
            Turn your resume into your next big project.
          </h1>
          <p style={{fontSize:15,color:"#888",lineHeight:1.6,maxWidth:420}}>
            Upload your PDF. Get a skill gap analysis, resume score, and 3 personalized project ideas in seconds.
          </p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
          onClick={() => document.getElementById("file-input").click()}
          style={{border:drag?"1.5px dashed #999":file?"1.5px dashed #bbb":"1.5px dashed #ddd",borderRadius:16,padding:"40px 24px",textAlign:"center",background:drag?"#f5f5f5":file?"#fafafa":"#fff",transition:"all 0.2s",cursor:"pointer",marginBottom:16}}
        >
          <input id="file-input" type="file" accept=".pdf" style={{display:"none"}} onChange={(e) => setFile(e.target.files[0])} />
          <div style={{width:48,height:48,borderRadius:12,background:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
            <span className="material-symbols-outlined" style={{fontSize:22,color:"#888"}}>upload_file</span>
          </div>
          {file ? (
            <div>
              <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:4}}>{file.name}</div>
              <div style={{fontSize:12,color:"#aaa"}}>{(file.size/1024).toFixed(0)} KB</div>
            </div>
          ) : (
            <div>
              <div style={{fontSize:14,fontWeight:500,color:"#333",marginBottom:6}}>Drop your resume here</div>
              <div style={{fontSize:12,color:"#bbb"}}>or click to browse — PDF only — max 10MB</div>
            </div>
          )}
        </div>

        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {[["bolt","Instant results"],["shield","Private"],["stars","AI-powered"]].map(([icon,label]) => (
            <div key={label} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,background:"#fff",border:"1px solid #ebebeb",borderRadius:10,padding:"8px 4px"}}>
              <span className="material-symbols-outlined" style={{fontSize:14,color:"#999"}}>{icon}</span>
              <span style={{fontSize:11,color:"#999",fontWeight:500}}>{label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{background:"#fff5f5",border:"1px solid #ffd0d0",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#c00",marginBottom:16}}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          style={{width:"100%",padding:"15px 24px",borderRadius:12,border:"none",background:(!file||loading)?"#e8e8e8":"#111",color:(!file||loading)?"#aaa":"#fff",fontSize:14,fontWeight:600,cursor:(!file||loading)?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s"}}
        >
          {loading ? "Analyzing resume..." : "Analyze My Resume"}
        </button>

        <div style={{display:"flex",alignItems:"center",gap:12,margin:"32px 0"}}>
          <div style={{flex:1,height:1,background:"#ebebeb"}} />
          <span style={{fontSize:11,color:"#ccc",fontWeight:500}}>OR EXPLORE</span>
          <div style={{flex:1,height:1,background:"#ebebeb"}} />
        </div>

        {[["Browse templates","grid_view"],["View success stories","workspace_premium"]].map(([label,icon]) => (
          <button key={label} style={{width:"100%",padding:"14px 18px",background:"#fff",border:"1px solid #ebebeb",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13,fontWeight:500,color:"#333",cursor:"pointer",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span className="material-symbols-outlined" style={{fontSize:18,color:"#bbb"}}>{icon}</span>
              {label}
            </div>
            <span className="material-symbols-outlined" style={{fontSize:16,color:"#ccc"}}>chevron_right</span>
          </button>
        ))}

      </main>
      <BottomNav />
    </div>
  );
}
