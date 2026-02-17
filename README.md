# VendorScout – AI Vendor Shortlist Builder

VendorScout is a web app that helps users compare vendors based on a specific need and a set of requirements.  
The app builds a shortlist, scores vendors, and returns a structured comparison table with evidence.

---

## Features

- Enter a business need (e.g. email delivery service, vector database)
- Add 5–8 key requirements (budget, region, must-have features)
- Generate a ranked shortlist
- Vendor comparison table:
  - price range
  - matched features
  - risks / limitations
  - evidence links + quoted snippets
- Save last 5 shortlists locally
- Simple scoring & weighting logic
- Deployable on Vercel

---

## Tech Stack

- Next.js (App Router)
- React + TailwindCSS
- Server API routes
- Fetch + scraping logic
- Local storage persistence

---

## How to run locally

1. Clone the repo

```bash
git clone <repo-url>
cd vendor-scout
```

2. Install dependencies

```bash
npm install
```

3. Add environment variables

Create `.env.local`

```
GEMINI_API_KEY=your_key_here
```

4. Run dev server

```bash
npm run dev
```

Visit:

```
http://localhost:3000
```

---


## What is done

✅ Form UI for need + requirements  
✅ API route for shortlist generation  
✅ Vendor scoring logic  
✅ Evidence extraction  
✅ Save last 5 shortlists  
✅ Basic error handling  
✅ Vercel deployment support  

---

## What is not done (future work)

❌ Authentication / user accounts  
❌ Persistent database storage  
❌ Advanced scraping with headless browser  
❌ Vendor caching layer  
❌ Background job queue  
❌ Rate limiting  
❌ Legal review for scraping  

---

## Notes

- This is a prototype / demo app
- Scraping reliability depends on vendor websites
- Some vendors may block automated requests
- Results are heuristic, not guaranteed accurate

---


