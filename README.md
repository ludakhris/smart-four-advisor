# Smart Four Advisor

A 3D move analysis engine for the GiiKER Smart Four board game. Helps you beat the computer's hard mode by detecting forks, modeling opponent responses, and recommending optimal moves.

## Quick Start (Local)

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## Deploy to Vercel (Easiest)

```bash
# Install Vercel CLI
npm i -g vercel

# From the project root:
vercel

# Follow the prompts. That's it.
# Your app will be live at https://your-project.vercel.app
```

## Deploy to Netlify

```bash
# Build first
npm run build

# Option A: Drag & drop
# Go to https://app.netlify.com/drop
# Drag the `dist` folder onto the page. Done.

# Option B: CLI
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

## Deploy to GitHub Pages

```bash
# 1. Create a GitHub repo and push this project

# 2. Build
npm run build

# 3. Install gh-pages
npm i -D gh-pages

# 4. Add to package.json scripts:
#    "deploy": "gh-pages -d dist"

# 5. Deploy
npm run deploy

# 6. In GitHub repo Settings > Pages, set source to gh-pages branch
# Live at https://yourusername.github.io/smart-four-advisor
```

## How to Use

1. Set your color (white/black) and who goes first to match your physical board
2. Tap cells to mirror moves — auto-places at the correct height
3. Recommendations appear automatically when it's your turn
4. Tap a recommendation card to play it
5. Side layer panels show the full 3D state at each height

## Engine Features

- **Minimax search** at depth 5 with alpha-beta pruning
- **Fork detection** — finds moves that create 2+ simultaneous winning threats
- **Opponent fork prevention** — 2-ply lookahead to avoid walking into traps
- **Fork disruption scoring** — bonus for moves that break up opponent setups
- **Danger alerts** — warns when opponent is converging on a fork
