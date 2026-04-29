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
