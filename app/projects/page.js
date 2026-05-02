"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

export default function ProjectsPage() {
  const { status } = useSession();
  const [data, setData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated") {
      const stored = sessionStorage.getItem("resumeResults");
      if (stored) setData(JSON.parse(stored));
      else router.replace("/");
    }
  }, [status]);

  if (status === "loading" || !data) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",
      justifyContent:"center",background:"#f9f9f9"}}>
      <div style={{width:20,height:20,border:"2px solid #eee",
        borderTop:"2px solid #111",borderRadius:"50%",
        animation:"spin 0.8s linear infinite"}}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  const { analysis, projects } = data;
  const scoreColor = !analysis?.resumeScore ? "#111" :
    analysis.resumeScore >= 80 ? "#2d7a4f" :
    analysis.resumeScore >= 60 ? "#a0620a" : "#c0392b";

  function openProject(i) {
    sessionStorage.setItem("activeProject", JSON.stringify(projects[i]));
    router.push("/projects/" + i);
  }

  return (
    <div style={{minHeight:"100vh",background:"#f9f9f9",paddingBottom:80}}>
      <Navbar />
      <main style={{maxWidth:560,margin:"0 auto",padding:"80px 24px 0"}}>
        <div style={{paddingTop:32,marginBottom:28}}>
          <h1 style={{fontSize:24,fontWeight:700,letterSpacing:"-0.03em",
            color:"#111",marginBottom:6}}>Your Results</h1>
          <p style={{fontSize:13,color:"#aaa"}}>Based on your resume analysis</p>
        </div>

        {analysis && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",
            gap:12,marginBottom:12}}>
            <div style={{background:"#fff",border:"1px solid #ebebeb",
              borderRadius:14,padding:"18px 20px"}}>
              <div style={{fontSize:11,fontWeight:500,color:"#bbb",
                letterSpacing:"0.04em",marginBottom:10}}>RESUME SCORE</div>
              <div style={{fontSize:36,fontWeight:700,color:scoreColor,
                letterSpacing:"-0.04em",lineHeight:1}}>
                {analysis.resumeScore}
                <span style={{fontSize:14,fontWeight:400,color:"#ccc"}}>/100</span>
              </div>
              <div style={{marginTop:12,height:3,background:"#f0f0f0",
                borderRadius:999}}>
                <div style={{height:3,borderRadius:999,background:scoreColor,
                  width:analysis.resumeScore+"%"}}/>
              </div>
            </div>
            <div style={{background:"#fff",border:"1px solid #ebebeb",
              borderRadius:14,padding:"18px 20px"}}>
              <div style={{fontSize:11,fontWeight:500,color:"#bbb",
                letterSpacing:"0.04em",marginBottom:10}}>SKILL GAPS</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {analysis.skillGaps?.slice(0,4).map((gap,i) => (
                  <span key={i} style={{fontSize:10,fontWeight:600,color:"#888",
                    background:"#f5f5f5",border:"1px solid #ebebeb",
                    borderRadius:6,padding:"3px 7px"}}>{gap}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {analysis?.scoreFeedback && (
          <div style={{background:"#fff",border:"1px solid #ebebeb",
            borderRadius:14,padding:"18px 20px",marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:500,color:"#bbb",
              letterSpacing:"0.04em",marginBottom:12}}>FEEDBACK</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {Object.entries(analysis.scoreFeedback).map(([key,val]) => (
                <div key={key}>
                  <div style={{fontSize:10,fontWeight:600,color:"#bbb",
                    textTransform:"uppercase",letterSpacing:"0.05em",
                    marginBottom:3}}>
                    {key.replace(/([A-Z])/g," $1")}
                  </div>
                  <div style={{fontSize:12,color:"#666",lineHeight:1.5}}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{fontSize:11,fontWeight:500,color:"#bbb",
          letterSpacing:"0.04em",marginBottom:14}}>PROJECT IDEAS</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {projects.map((project,i) => (
            <div key={i} style={{background:"#fff",border:"1px solid #ebebeb",
              borderRadius:14,padding:"20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",
                alignItems:"flex-start",marginBottom:8}}>
                <h2 style={{fontSize:15,fontWeight:600,color:"#111",
                  letterSpacing:"-0.02em",lineHeight:1.3,flex:1,
                  paddingRight:12}}>{project.title}</h2>
                <span style={{fontSize:10,fontWeight:600,color:"#888",
                  background:"#f5f5f5",border:"1px solid #ebebeb",
                  borderRadius:6,padding:"3px 8px",whiteSpace:"nowrap"}}>
                  {project.difficulty||"Intermediate"}
                </span>
              </div>
              <p style={{fontSize:13,color:"#999",lineHeight:1.6,
                marginBottom:14}}>{project.description}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                {project.techStack.map((tech,j) => (
                  <span key={j} style={{fontSize:11,fontWeight:500,color:"#777",
                    background:"#f7f7f7",border:"1px solid #eee",borderRadius:6,
                    padding:"3px 8px"}}>{tech}</span>
                ))}
              </div>
              <button onClick={() => openProject(i)}
                style={{width:"100%",padding:"11px",background:"#111",
                  color:"#fff",border:"none",borderRadius:10,fontSize:13,
                  fontWeight:600,cursor:"pointer",display:"flex",
                  alignItems:"center",justifyContent:"center",gap:6}}>
                View Roadmap
                <span className="material-symbols-outlined"
                  style={{fontSize:16}}>arrow_forward</span>
              </button>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
