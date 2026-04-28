"use client";
export default function Navbar({ showBack = false, subtitle = null }) {
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
            {subtitle && <div style={{fontSize:11,color:"#999",marginTop:1}}>{subtitle}</div>}
          </div>
        </div>
        <div style={{width:30,height:30,borderRadius:"50%",background:"#f0f0f0",border:"1px solid #e0e0e0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"#666"}}>U</div>
      </div>
    </header>
  );
}
