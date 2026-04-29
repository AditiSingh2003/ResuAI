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
