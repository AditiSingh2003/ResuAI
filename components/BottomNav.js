"use client";
import { usePathname, useRouter } from "next/navigation";
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const items = [
    { label: "Home", icon: "home", href: "/" },
    { label: "Projects", icon: "folder_special", href: "/projects" },
    { label: "Settings", icon: "settings", href: "/settings" },
  ];
  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"#fff",borderTop:"1px solid #ebebeb"}}>
      <div style={{maxWidth:560,margin:"0 auto",display:"flex",justifyContent:"space-around",alignItems:"center",height:56}}>
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <button key={item.label} onClick={() => router.push(item.href)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:active?"#111":"#bbb",transition:"color 0.15s"}}>
              <span className="material-symbols-outlined" style={{fontSize:22,fontVariationSettings:active?"'FILL' 1, 'wght' 400":"'FILL' 0, 'wght' 300"}}>{item.icon}</span>
              <span style={{fontSize:10,fontWeight:active?600:400,letterSpacing:"0.02em"}}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
