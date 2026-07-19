# Fairbnb

Fairbnb tells you whether a short-term rental is priced fairly by comparing it against real, comparable hotels nearby — using video/image embeddings instead of manually scraped comps.

It's built on two symmetric modes:

- **I'm a Host** — upload a video walkthrough of your room, drop a pin (or type an address), and Fairbnb suggests a fair nightly price based on visually similar hotels nearby.
- **I'm Looking** — upload a photo of an existing listing plus what it's charging, and Fairbnb tells you if you're being overcharged relative to comparable hotels nearby.

### Demo

| For Hosts | For Travelers |
| --- | --- |
| [host-demo.mp4](https://fairbnb-valuation-media.s3.us-east-1.amazonaws.com/demo/host-demo.mp4) | [looking-demo.mp4](https://fairbnb-valuation-media.s3.us-east-1.amazonaws.com/demo/looking-demo.mp4) |

Both are embedded live on the home page ([frontend/components/Features.tsx](frontend/components/Features.tsx)).

## How it works

1. **Embed the input.** The user's video (Host mode) or photo (Looking mode) is embedded into a vector using TwelveLabs' Marengo 3.0 model ([backend/embed.py](backend/embed.py)).
2. **Find real comps.** Stay22's API is queried for ~20 real hotels near the given address or coordinates, with live pricing for the same check-in/check-out window ([backend/stay22.py](backend/stay22.py)).
3. **Embed the comps.** Each hotel's thumbnail image is embedded into the same vector space as the user's input.
4. **Rank by similarity.** Cosine similarity between the user's embedding and each hotel's embedding ranks how visually comparable each hotel is ([backend/similarity.py](backend/similarity.py)). If the average similarity of the top matches is too low, the result is flagged as low-confidence rather than silently averaging unrelated properties.
5. **Price it.** The fair price is the average nightly rate of the top 3 most visually similar hotels. In Looking mode, this is also compared against the listing's stated price to compute an overcharge amount/percentage.
6. **Visualize it.** A 3D projection of the user's embedding against the matched hotel embeddings is rendered on the result page ([backend/vectors.py](backend/vectors.py), [frontend/components/VectorPlot.tsx](frontend/components/VectorPlot.tsx)).

User uploads and re-hosted hotel thumbnails are archived to S3 per valuation run ([backend/storage.py](backend/storage.py)) so results stay reproducible even if the original Stay22 thumbnail URL changes.

There are also two mini-games (Higher/Lower and Odd One Out) that use the same real hotel/pricing data to make exploring comps more fun while a user has no saved valuations yet.

## Tech stack

**Frontend** — Next.js 16 (App Router), React 19, Tailwind CSS 4, Leaflet/react-leaflet for the map picker, Plotly for the 3D vector plot.

**Backend** — FastAPI, SQLite, JWT auth (access + HttpOnly refresh-token cookie), boto3.

**External services**
- [TwelveLabs](https://twelvelabs.io) (Marengo 3.0) — video/image embeddings
- [Stay22](https://www.stay22.com) — real hotel search + live pricing
- AWS S3 — durable storage for uploaded media and re-hosted hotel thumbnails

## Project structure

```
frontend/    Next.js app (App Router) — pages, components, auth context
backend/     FastAPI app — auth, valuation pipeline, Stay22/TwelveLabs/S3 integration
demo-assets/ Local-only demo videos/images (gitignored, not committed — see below)
```

## Running locally

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` with:

```
JWT_SECRET=some-random-secret
TWELVELABS_API_KEY=...
STAY22_API_KEY=...
STAY22_AID=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=fairbnb-valuation-media
```

AWS credentials are picked up from the standard boto3 credential chain (`~/.aws/credentials`, environment variables, etc.) — not from `.env`.

```bash
python3 main.py   # serves on :8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # serves on :3000
```

The frontend expects the API at `http://localhost:8000` and the API's CORS config expects the frontend at `http://localhost:3000` ([backend/main.py](backend/main.py)).

## Demo assets

Demo videos/images used during development live in a local `demo-assets/` folder, which is gitignored and not tracked in this repo. The two videos actually shown on the home page are hosted on S3 and linked above — no need to have `demo-assets/` locally to run the app.
