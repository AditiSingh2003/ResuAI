"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

export default function ProjectDetailPage() {
  const [project, setProject] = useState(null);
  const [checked, setChecked] = useState({});
  const [readme, setReadme] = useState(null);
  const [loadingReadme, setLoadingReadme] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("activeProject");
    if (stored) setProject(JSON.parse(stored));
    else router.push("/projects");
  }, []);

  function toggle(i) { setChecked(p => ({ ...p, [i]: !p[i] })); }
  const done = Object.values(checked).filter(Boolean).length;

  async function generateReadme() {
    setLoadingReadme(true);
    try {
      const res = await fetch("/api/readme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setReadme(json.readme);
    } catch (err) { alert("Failed: " + err.message); }
    finally { setLoadingReadme(false); }
  }

  if (!project) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#bbb",fontSize:13}}>Loading...</div>;

  const pct = Math.round((done / project.roadmap.length) * 100);

  return (
    <div style={{minHeight:"100vh",background:"#f9f9f9",paddingBottom:80}}>
      <Navbar showBack subtitle={project.title} />
      <main style={{maxWidth:560,margin:"0 auto",padding:"80px 24px 0"}}>
        <div style={{paddingTop:32,marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontWeight:600,color:"#888",background:"#f5f5f5",border:"1px solid #eee",borderRadius:6,padding:"3px 8px"}}>{project.difficulty||"Intermediate"}</span>
            {project.techStack?.slice(0,3).map((t,i) => (
              <span key={i} style={{fontSize:10,fontWeight:500,color:"#bbb",background:"#fafafa",border:"1px solid #eee",borderRadius:6,padding:"3px 8px"}}>{t}</span>
            ))}
          </div>
          <h1 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.03em",color:"#111",marginBottom:8,lineHeight:1.2}}>{project.title}</h1>
          <p style={{fontSize:13,color:"#999",lineHeight:1.6,marginBottom:20}}>{project.description}</p>
          <div style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:12,padding:"14px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:600,color:"#333"}}>{done} of {project.roadmap.length} steps complete</span>
              <span style={{fontSize:12,fontWeight:700,color:"#111"}}>{pct}%</span>
            </div>
            <div style={{height:4,background:"#f0f0f0",borderRadius:999}}>
              <div style={{height:4,borderRadius:999,background:"#111",width:pct+"%",transition:"width 0.4s ease"}} />
            </div>
          </div>
        </div>

        {project.architecture && (
          <div style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:12,padding:"16px 18px",marginBottom:16}}>
            <div style={{fontSize:10,fontWeight:600,color:"#bbb",letterSpacing:"0.05em",marginBottom:6}}>ARCHITECTURE</div>
            <p style={{fontSize:13,color:"#777",lineHeight:1.6}}>{project.architecture}</p>
          </div>
        )}

        <div style={{fontSize:10,fontWeight:600,color:"#bbb",letterSpacing:"0.05em",marginBottom:14}}>ROADMAP</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:32}}>
          {project.roadmap.map((step,i) => {
            const isDone = checked[i];
            return (
              <div key={i} onClick={() => toggle(i)} style={{display:"flex",alignItems:"flex-start",gap:14,background:"#fff",border:"1px solid "+(isDone?"#e8e8e8":"#ebebeb"),borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s",opacity:isDone?0.5:1}}>
                <div style={{width:20,height:20,borderRadius:6,border:"1.5px solid "+(isDone?"#111":"#d0d0d0"),background:isDone?"#111":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all 0.15s"}}>
                  {isDone && <span className="material-symbols-outlined" style={{fontSize:13,color:"#fff"}}>check</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:600,color:"#ccc",letterSpacing:"0.04em",marginBottom:3}}>STEP {i+1}</div>
                  <div style={{fontSize:13,color:isDone?"#bbb":"#333",lineHeight:1.5,textDecoration:isDone?"line-through":"none"}}>
                    {step.replace(/^Step \d+[:.]\s*/i,"")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {project.skillsGained?.length > 0 && (
          <div style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:12,padding:"16px 18px",marginBottom:24}}>
            <div style={{fontSize:10,fontWeight:600,color:"#bbb",letterSpacing:"0.05em",marginBottom:10}}>SKILLS YOU WILL GAIN</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {project.skillsGained.map((s,i) => (
                <span key={i} style={{fontSize:11,fontWeight:500,color:"#666",background:"#f7f7f7",border:"1px solid #eee",borderRadius:6,padding:"4px 10px"}}>{s}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:14,padding:"20px",marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:4}}>GitHub README</div>
          <p style={{fontSize:12,color:"#aaa",marginBottom:16,lineHeight:1.5}}>Auto-generate a professional README.md ready to paste into GitHub.</p>
          <button onClick={generateReadme} disabled={loadingReadme} style={{width:"100%",padding:"12px",background:loadingReadme?"#f5f5f5":"#111",color:loadingReadme?"#bbb":"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:loadingReadme?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <span className="material-symbols-outlined" style={{fontSize:16}}>auto_awesome</span>
            {loadingReadme ? "Generating..." : "Generate README"}
          </button>
        </div>

        {readme && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}}>
            <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:600,maxHeight:"80vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{padding:"16px 20px",borderBottom:"1px solid #ebebeb",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:14,fontWeight:600,color:"#111"}}>README.md</span>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={() => { navigator.clipboard.writeText(readme); setCopied(true); setTimeout(()=>setCopied(false),2000); }} style={{padding:"7px 14px",background:"#111",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    {copied?"Copied!":"Copy"}
                  </button>
                  <button onClick={() => setReadme(null)} style={{padding:"7px 14px",background:"#f5f5f5",color:"#666",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Close</button>
                </div>
              </div>
              <pre style={{overflow:"auto",padding:"20px",fontSize:12,color:"#555",whiteSpace:"pre-wrap",fontFamily:"monospace",lineHeight:1.7}}>{readme}</pre>
            </div>
          </div>
        )}

      </main>
      <BottomNav />
    </div>
  );
}
