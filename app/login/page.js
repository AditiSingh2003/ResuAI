"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status]);

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  }

  // Show spinner while loading OR while redirecting authenticated users
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
      padding:24,fontFamily:"Inter,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <style>{"*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#f9f9f9}.material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24}@keyframes spin{to{transform:rotate(360deg)}}"}</style>

      <div style={{width:"100%",maxWidth:400}}>

        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{display:"inline-flex",alignItems:"center",
            justifyContent:"center",width:48,height:48,background:"#111",
            borderRadius:12,marginBottom:16}}>
            <span style={{color:"#fff",fontSize:22,fontWeight:700}}>R</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,color:"#111",
            letterSpacing:"-0.03em",marginBottom:8}}>
            Welcome to ResuAI</h1>
          <p style={{fontSize:14,color:"#999",lineHeight:1.6}}>
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
              opacity:loading?0.7:1,marginBottom:20,
              transition:"border-color 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#999"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#e0e0e0"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? "Signing in..." : "Continue with Google"}
          </button>

          <div style={{display:"flex",alignItems:"center",gap:12,
            marginBottom:20}}>
            <div style={{flex:1,height:1,background:"#f0f0f0"}}/>
            <span style={{fontSize:11,color:"#ccc",fontWeight:500}}>
              COMING SOON</span>
            <div style={{flex:1,height:1,background:"#f0f0f0"}}/>
          </div>

          <button disabled
            style={{width:"100%",padding:"14px 20px",background:"#fafafa",
              border:"1.5px solid #f0f0f0",borderRadius:12,display:"flex",
              alignItems:"center",justifyContent:"center",gap:12,fontSize:14,
              fontWeight:500,color:"#ccc",cursor:"not-allowed"}}>
            <span className="material-symbols-outlined"
              style={{fontSize:18,color:"#ddd"}}>phone</span>
            Continue with Phone
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[["bolt","3 free / month"],["shield","Private"],
            ["history","History saved"]].map(([icon,label]) => (
            <div key={label} style={{background:"#fff",
              border:"1px solid #ebebeb",borderRadius:12,
              padding:"12px 8px",textAlign:"center"}}>
              <span className="material-symbols-outlined"
                style={{fontSize:18,color:"#bbb",display:"block",
                  marginBottom:4}}>{icon}</span>
              <span style={{fontSize:10,color:"#bbb",fontWeight:500,
                lineHeight:1.3,display:"block"}}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
