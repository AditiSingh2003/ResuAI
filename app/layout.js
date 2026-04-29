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
