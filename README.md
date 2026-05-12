<div align="center">

<br/>

# ResuAI

### Turn your resume into your next big project.

AI-powered resume analysis — get a score, skill gap report, and 3 personalized project ideas in seconds.

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-resu--ai--green.vercel.app-0058BE?style=flat-square&logo=vercel&logoColor=white)](https://resu-ai-green.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-AditiSingh2003%2FResuAI-181717?style=flat-square&logo=github)](https://github.com/AditiSingh2003/ResuAI)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

<br/>

</div>

---

## What is ResuAI?

Most developers don't know what to build next to improve their chances of getting hired. ResuAI solves this — upload your resume PDF and get back:

- **Resume Score (0–100)** with feedback on clarity, impact, technical depth, and relevance
- **Skill Gap Analysis** — technologies you're missing based on your career level
- **3 Personalized Project Ideas** — each with tech stack, architecture notes, 5-step build roadmap, and auto-generated GitHub README

---

## Features

- 📄 **PDF Upload** — drag-and-drop or click to upload
- 🤖 **AI Analysis** — GPT-4o-mini scores your resume and detects skill gaps
- 💡 **Project Ideas** — 3 tailored projects with roadmaps and architecture notes
- 📝 **README Generator** — one-click professional `README.md` for each project
- 🔐 **Google OAuth** — sign in securely with your Google account
- 📊 **Usage Limits** — 3 free analyses per month with live usage badge
- 🕐 **History** — last 5 analyses saved and re-viewable from settings
- ⚙️ **Settings Page** — account info, history tab, and plan management
- 🚀 **Production Ready** — deployed on Vercel with GitHub CI/CD

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Inline Styles |
| Backend | Next.js API Routes (Serverless) |
| AI | OpenAI GPT-4o-mini |
| PDF Parsing | unpdf |
| Auth | NextAuth.js v4, Google OAuth 2.0 |
| Database | MongoDB Atlas, Mongoose |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- Git

### 1. Clone the repo

```bash
git clone https://github.com/AditiSingh2003/ResuAI.git
cd ResuAI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```env
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_32_char_hex_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# MongoDB Atlas (optional locally — see note below)
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/resuai
```

Generate a secure `NEXTAUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Note:** If `MONGODB_URI` is not set, the app automatically uses an in-memory MongoDB instance for local development. No Atlas setup needed to run locally.

### 4. Set up Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → Create project
2. APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. Copy Client ID and Secret into `.env.local`

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
ResuAI/
├── app/
│   ├── api/
│   │   ├── analyze/route.js           # PDF upload + AI analysis + limit check
│   │   ├── readme/route.js            # GitHub README generation
│   │   ├── user/route.js              # User profile + cache retrieval
│   │   └── auth/[...nextauth]/route.js
│   ├── projects/
│   │   ├── page.js                    # Results page
│   │   └── [id]/page.js               # Roadmap + checklist
│   ├── login/page.js                  # Google OAuth login
│   ├── settings/page.js               # Account, history, plan tabs
│   ├── layout.js                      # Root layout
│   └── page.js                        # Home + upload
├── components/
│   ├── Navbar.js                      # Top nav with usage badge
│   ├── BottomNav.js                   # Bottom navigation
│   └── SessionProvider.js             # NextAuth session wrapper
├── lib/
│   ├── mongoose.js                    # DB connection with dev fallback
│   ├── generateIdeas.js               # OpenAI integration
│   ├── parseResume.js                 # PDF text extraction
│   └── models/
│       ├── User.js                    # User schema
│       └── ResumeCache.js             # Resume history schema
└── .env.local                         # Secrets — never commit
```

---

## How It Works

```
Upload PDF
    │
    ▼
unpdf extracts text (server-side)
    │
    ▼
GPT-4o-mini analyzes resume
    ├── Score (0-100) across 4 categories
    ├── Current skills detected
    ├── Skill gaps identified
    └── 3 project ideas generated
              │
              ▼
        Each project includes:
        title · difficulty · tech stack
        architecture · 5-step roadmap
        skills gained · why it fits you
    │
    ▼
Results saved to MongoDB
Usage counter incremented
    │
    ▼
View results · check off roadmap steps
Generate README · export as PDF
```

---

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import repo
3. Add environment variables under **Settings → Environment Variables**:

```
OPENAI_API_KEY
NEXTAUTH_URL         → https://your-app.vercel.app
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MONGODB_URI          → your Atlas connection string
```

4. Add your Vercel URL to Google OAuth Console:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

5. Click **Deploy**

### Future updates

```bash
git add .
git commit -m "your changes"
git push
# Vercel auto-deploys on every push
```

---

## Usage Limits

| Plan | Analyses / Month | History | README Generator |
|---|---|---|---|
| Free | 3 | Last 5 | ✅ |
| Pro | Unlimited *(coming soon)* | Last 5 | ✅ |

---

## Common Issues

**`redirect_uri_mismatch`**
Add your exact app URL to Google Console → Authorized redirect URIs. Make sure `NEXTAUTH_URL` matches exactly.

**`querySrv ECONNREFUSED`**
Your ISP may block MongoDB SRV DNS. Leave `MONGODB_URI` unset locally — the app uses in-memory MongoDB automatically.

**PDF shows empty results**
Make sure your PDF is text-based, not a scanned image. Scanned PDFs need OCR before analysis.

**Vercel env vars not applying**
After changing env vars on Vercel you must manually redeploy:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

---

## Roadmap

- [x] PDF upload and parsing
- [x] AI resume scoring and skill gap analysis
- [x] 3 personalized project ideas with roadmaps
- [x] GitHub README generator
- [x] Google OAuth authentication
- [x] Monthly usage limits (3/month free)
- [x] Resume history (last 5)
- [x] Settings page with 3 tabs
- [x] Production deployment on Vercel
- [ ] Stripe Pro plan
- [ ] Phone OTP login
- [ ] Shareable public results URL
- [ ] Email report delivery
- [ ] Portfolio page generator

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built by **Adith Akurti**

⭐ Star this repo if you found it useful

</div>
